package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.CourseRequestDto;
import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.dto.CourseMetadataDto;
import com.screening.interviews.dto.ModuleDto;
import com.screening.interviews.model.Course;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.CourseRepository;
import com.screening.interviews.utils.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.screening.interviews.prompts.CoursePrompts;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final CourseRepository courseRepository;
    private final ThreadMatcherService threadMatcherService;
    private final InputSanitizer inputSanitizer;
    private final CacheService cacheService;

    public CourseResponseDto generateCourse(CourseRequestDto request) {
        String cacheKey = "course:generated:" + request.getTopic() + ":" + request.getDifficultyLevel() + ":" + request.getModuleCount();

        // Check cache first with error handling
        try {
            Object cachedResult = cacheService.get(cacheKey);
            if (cachedResult instanceof CourseResponseDto) {
                logger.info("Retrieved course from cache: {}", request.getTopic());
                return (CourseResponseDto) cachedResult;
            } else if (cachedResult != null) {
                logger.warn("Cached object is not of expected type: {}", cachedResult.getClass());
                // Clear the corrupted cache entry
                cacheService.delete(cacheKey);
            }
        } catch (Exception e) {
            logger.warn("Cache retrieval failed for key: {}, proceeding without cache: {}", cacheKey, e.getMessage());
            // Clear the corrupted cache entry
            cacheService.delete(cacheKey);
        }

        String sanitizedTopic = inputSanitizer.sanitizeInput(request.getTopic());
        sanitizedTopic = inputSanitizer.handleSpecialSymbols(sanitizedTopic);

        logger.info("Starting course generation for topic: {}", sanitizedTopic);
        String masterPrompt = CoursePrompts.generateCoursePrompt(sanitizedTopic, request.getDifficultyLevel());

        CourseResponseDto result = generateCourseViaGemini(masterPrompt);

        if (result == null || (result.getCourseMetadata() == null && result.getModules() == null)) {
            logger.warn("Received empty or null course response from Gemini.");
            return null;
        }

        Course savedCourse = saveCourse(result);

        List<Long> relevantThreadIds = threadMatcherService.findRelevantThreads(result);
        threadMatcherService.associateCourseWithThreads(savedCourse, relevantThreadIds);

        CourseResponseDto finalResult = mapEntityToCourseResponseDto(savedCourse);

        // Cache the result with error handling
        try {
            cacheService.set(cacheKey, finalResult, Duration.ofHours(2));
            logger.debug("Successfully cached course result for key: {}", cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to cache course result for key: {}: {}", cacheKey, e.getMessage());
        }

        return finalResult;
    }

    @Cacheable(value = "courses", key = "#id", unless = "#result == null")
    public CourseResponseDto getCourseById(Long id) {
        logger.info("Fetching course by ID: {}", id);

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
        return mapEntityToCourseResponseDto(course);
    }

    @Cacheable(value = "course-list", key = "'all-courses'", unless = "#result == null || #result.isEmpty()")
    public List<CourseResponseDto> getAllCourses() {
        logger.info("Fetching all courses");
        List<Course> courses = courseRepository.findAll();
        return courses.stream()
                .map(this::mapEntityToCourseResponseDto)
                .collect(Collectors.toList());
    }

    @Caching(
            put = @CachePut(value = "courses", key = "#id"),
            evict = @CacheEvict(value = "course-list", key = "'all-courses'")
    )
    public CourseResponseDto updateCourse(Long id, CourseRequestDto request) {
        Course existingCourse = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));

        String sanitizedTopic = inputSanitizer.sanitizeInput(request.getTopic());
        sanitizedTopic = inputSanitizer.handleSpecialSymbols(sanitizedTopic);

        String masterPrompt = CoursePrompts.updateCoursePrompt(sanitizedTopic);

        CourseResponseDto updatedDto = generateCourseViaGemini(masterPrompt);
        if (updatedDto == null) {
            throw new RuntimeException("Failed to get updated course info from Gemini.");
        }

        CourseMetadataDto meta = updatedDto.getCourseMetadata();
        existingCourse.setTitle(meta.getTitle());
        existingCourse.setDescription(meta.getDescription());
        existingCourse.setDifficultyLevel(meta.getDifficultyLevel());

        Course updatedCourse = courseRepository.save(existingCourse);

        // Clear related caches
        cacheService.deletePattern("course:generated:*");

        return mapEntityToCourseResponseDto(updatedCourse);
    }

    @Caching(
            evict = {
                    @CacheEvict(value = "courses", key = "#id"),
                    @CacheEvict(value = "course-list", key = "'all-courses'")
            }
    )
    public void deleteCourse(Long id) {
        logger.info("Deleting course with ID: {}", id);
        courseRepository.deleteById(id);

        // Clear related caches
        cacheService.deletePattern("course:generated:*");
    }

    // Clear all course-related caches
    public void clearAllCourseCaches() {
        try {
            cacheService.deletePattern("courses:*");
            cacheService.deletePattern("course-list:*");
            cacheService.deletePattern("course:generated:*");
            logger.info("Cleared all course caches successfully");
        } catch (Exception e) {
            logger.error("Error clearing course caches: {}", e.getMessage());
        }
    }

    // Rest of your private methods remain the same...
    private CourseResponseDto mapEntityToCourseResponseDto(Course course) {
        // Your existing implementation
        CourseMetadataDto courseMetadataDto = CourseMetadataDto.builder()
                .title(course.getTitle())
                .description(course.getDescription())
                .difficultyLevel(course.getDifficultyLevel())
                .prerequisites(course.getPrerequisites())
                .build();

        List<ModuleDto> moduleDtos = course.getModules().stream()
                .map(module -> ModuleDto.builder()
                        .id(module.getId())
                        .moduleId(module.getModuleId())
                        .title(module.getTitle())
                        .description(module.getDescription())
                        .duration(module.getDuration())
                        .learningObjectives(module.getLearningObjectives())
                        .complexityLevel(module.getComplexityLevel())
                        .keyTerms(module.getKeyTerms())
                        .definitions(module.getDefinitions())
                        .build())
                .collect(Collectors.toList());

        return CourseResponseDto.builder()
                .id(course.getId())
                .courseUuid(course.getCourseUuid())
                .courseMetadata(courseMetadataDto)
                .modules(moduleDtos)
                .build();
    }

    private CourseResponseDto generateCourseViaGemini(String masterPrompt) {
        String escapedPrompt;
        try {
            escapedPrompt = inputSanitizer.escapeForJson(masterPrompt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to escape master prompt", e);
        }

        String payload = CoursePrompts.geminiApiPayload(escapedPrompt);

        try {
            logger.info("Calling Gemini API for course generation...");
            String rawResponse = geminiWebClient.post()
                    .uri("") // Base URL set in application.properties.
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (rawResponse != null && rawResponse.length() > 500) {
                logger.debug("Raw response from Gemini API (first 500 chars): {}", rawResponse.substring(0, 500) + "...");
            } else {
                logger.debug("Raw response from Gemini API: {}", rawResponse);
            }

            if (rawResponse == null || rawResponse.trim().isEmpty()) {
                logger.error("Gemini API returned empty response");
                throw new RuntimeException("Empty response from Gemini API");
            }

            rawResponse = rawResponse.replaceAll("(?m)^#.*", "").trim();

            int jsonStart = rawResponse.indexOf('{');
            if (jsonStart != -1) {
                rawResponse = rawResponse.substring(jsonStart);
            } else {
                throw new RuntimeException("No JSON object found in Gemini API response");
            }

            objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);

            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String embeddedJson = textNode.asText();
            if (embeddedJson == null || embeddedJson.trim().isEmpty()) {
                logger.warn("Gemini's 'text' field is empty or missing.");
                return null;
            }

            embeddedJson = embeddedJson.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            try {
                return objectMapper.readValue(embeddedJson, CourseResponseDto.class);
            } catch (JsonMappingException jme) {
                logger.warn("Failed to parse Gemini response JSON. Attempting fixes: {}", jme.getMessage());

                try {
                    String fixedJson = fixTrailingCommas(embeddedJson);
                    fixedJson = ensureKeyTermsAndDefinitions(fixedJson);
                    return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                } catch (Exception e1) {
                    logger.warn("Basic fixes failed. Attempting advanced bracket repair: {}", e1.getMessage());

                    try {
                        String fixedJson = fixJsonBracketMismatches(embeddedJson);
                        return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                    } catch (Exception e2) {
                        logger.warn("Advanced fixes failed. Attempting last-resort fixes: {}", e2.getMessage());

                        String fixedJson = fixTrailingCommas(embeddedJson);
                        fixedJson = fixJsonBracketMismatches(fixedJson);
                        fixedJson = ensureKeyTermsAndDefinitions(fixedJson);
                        fixedJson = fixArrayClosingBrackets(fixedJson);

                        try {
                            return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                        } catch (Exception e3) {
                            logger.error("All JSON repair attempts failed. Generating fallback course: {}", e3.getMessage());
                            return generateFallbackCourse();
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            return generateFallbackCourse();
        }
    }


    private CourseResponseDto generateFallbackCourse() {
        CourseMetadataDto metadata = CourseMetadataDto.builder()
                .title("General Educational Course")
                .description("This is a fallback course generated when the original request couldn't be processed properly. It covers general educational topics.")
                .difficultyLevel("Mixed")
                .prerequisites(List.of("No specific prerequisites"))
                .build();

        List<ModuleDto> modules = new ArrayList<>();
        ModuleDto module1 = ModuleDto.builder()
                .moduleId("M1")
                .title("Introduction to Learning")
                .description("This module introduces the fundamental concepts of effective learning strategies.")
                .complexityLevel("Foundational")
                .duration("30 minutes")
                .learningObjectives(List.of("Understand basic learning principles", "Identify personal learning styles"))
                .keyTerms(List.of("Learning styles", "Study techniques", "Knowledge retention", "Active learning"))
                .definitions(List.of(
                        "Learning styles: Different approaches to learning that work best for different individuals.",
                        "Study techniques: Methods used to improve learning efficiency and effectiveness.",
                        "Knowledge retention: The ability to keep information in memory over time.",
                        "Active learning: Engaging with material through discussion, practice, and application."
                ))
                .build();

        modules.add(module1);

        return CourseResponseDto.builder()
                .courseMetadata(metadata)
                .modules(modules)
                .build();
    }

    private String fixArrayClosingBrackets(String json) {
        if (json == null || json.isEmpty()) {
            return json;
        }

        StringBuilder sb = new StringBuilder();
        int openBraces = 0;
        int openBrackets = 0;
        boolean inQuote = false;
        boolean escaped = false;

        // First scan to count existing brackets without modifying anything
        for (char c : json.toCharArray()) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (c == '\\') {
                escaped = true;
            } else if (c == '"' && !escaped) {
                inQuote = !inQuote;
            } else if (!inQuote) {
                if (c == '{') openBraces++;
                else if (c == '}') openBraces--;
                else if (c == '[') openBrackets++;
                else if (c == ']') openBrackets--;
            }
        }

        // Reset for second pass
        inQuote = false;
        escaped = false;

        // Second pass to fix imbalances
        for (char c : json.toCharArray()) {
            sb.append(c);

            if (escaped) {
                escaped = false;
                continue;
            }

            if (c == '\\') {
                escaped = true;
            } else if (c == '"' && !escaped) {
                inQuote = !inQuote;
            }
        }

        // After all characters have been processed, balance any remaining brackets
        String result = sb.toString();

        // Fix mismatched closing brackets (the issue in the error)
        // Look for pattern where an array should be closed but an object closing appears instead
        result = result.replaceAll("\\}\\s*\\}", "]}");

        // Add missing closing brackets at the end if needed
        if (openBrackets > 0) {
            StringBuilder closingBrackets = new StringBuilder();
            for (int i = 0; i < openBrackets; i++) {
                closingBrackets.append("]");
            }

            // Insert before the last closing braces if they exist
            int lastBrace = result.lastIndexOf("}");
            if (lastBrace > 0) {
                result = result.substring(0, lastBrace) + closingBrackets + result.substring(lastBrace);
            } else {
                result = result + closingBrackets;
            }
        }

        return result;
    }

    private String fixTrailingCommas(String json) {
        if (json == null || json.isEmpty()) {
            return json;
        }

        // Fix trailing commas in objects
        json = json.replaceAll(",\\s*}", "}");

        // Fix trailing commas in arrays
        json = json.replaceAll(",\\s*]", "]");

        return json;
    }

    private String ensureKeyTermsAndDefinitions(String json) {
        try {
            // Parse the JSON into a JsonNode
            JsonNode rootNode = objectMapper.readTree(json);

            // Check if the modules array exists and has elements
            if (rootNode.has("modules") && rootNode.get("modules").isArray()) {
                JsonNode modulesNode = rootNode.get("modules");
                boolean needsUpdate = false;

                // Check each module for keyTerms and definitions
                for (JsonNode moduleNode : modulesNode) {
                    if ((!moduleNode.has("keyTerms") || !moduleNode.has("definitions"))) {
                        needsUpdate = true;
                        break;
                    }
                }

                // If needs update, apply fixes
                if (needsUpdate) {
                    logger.info("Adding missing keyTerms and definitions fields to modules");

                    // This is a simple string-based fix that adds empty arrays
                    // A more robust solution would modify the JsonNode directly and reserialize
                    json = json.replaceAll("(\"moduleId\"\\s*:\\s*\"[^\"]*\"[^{]*?)(\"title\")",
                            "$1\"keyTerms\": [], \"definitions\": [], $2");
                }
            }

            return json;
        } catch (Exception e) {
            logger.warn("Error while ensuring keyTerms and definitions: {}", e.getMessage());
            return json; // Return original if we can't parse it
        }
    }

    private List<String> splitPrerequisitesString(String input) {
        if (input == null || input.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // If the string is just "None" or similar, return as single item
        if (input.trim().equalsIgnoreCase("none") ||
                input.trim().equalsIgnoreCase("n/a") ||
                input.trim().equalsIgnoreCase("not applicable")) {
            return List.of(input.trim());
        }

        // If the input contains bullet points or numbered lists, split by those
        if (input.contains("•") || input.contains("-") || input.contains("*")) {
            String[] items = input.split("[•\\-\\*]");
            return Arrays.stream(items)
                    .map(String::trim)
                    .filter(item -> !item.isEmpty())
                    .collect(Collectors.toList());
        }

        // If it contains sentences (periods followed by space), split by those
        if (input.matches(".*\\.\\s+.*")) {
            String[] items = input.split("\\.\\s+");
            return Arrays.stream(items)
                    .map(String::trim)
                    .filter(item -> !item.isEmpty())
                    .map(item -> item.endsWith(".") ? item : item + ".")
                    .collect(Collectors.toList());
        }

        // If it contains commas with reasonable-length segments, split by commas
        if (input.contains(",")) {
            String[] items = input.split(",");
            // Only use comma splitting if all segments are reasonable length (not too short)
            if (Arrays.stream(items).allMatch(item -> item.trim().length() > 3)) {
                return Arrays.stream(items)
                        .map(String::trim)
                        .filter(item -> !item.isEmpty())
                        .collect(Collectors.toList());
            }
        }

        // Default: return the whole string as a single item
        return List.of(input);
    }

    private String fixJsonBracketMismatches(String json) {
        if (json == null || json.isEmpty()) {
            return json;
        }

        // Create a more comprehensive JSON repair
        StringBuilder sb = new StringBuilder();
        char[] chars = json.toCharArray();

        // Stack to track opening brackets/braces
        List<Character> stack = new ArrayList<>();
        boolean inQuote = false;
        boolean escaped = false;

        for (int i = 0; i < chars.length; i++) {
            char c = chars[i];

            // Handle escaping
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }

            if (c == '\\') {
                sb.append(c);
                escaped = true;
                continue;
            }

            // Handle quotes
            if (c == '"' && !escaped) {
                sb.append(c);
                inQuote = !inQuote;
                continue;
            }

            // Skip processing structure when in quotes
            if (inQuote) {
                sb.append(c);
                continue;
            }

            // Process structural characters
            switch (c) {
                case '{':
                    stack.add('{');
                    sb.append(c);
                    break;
                case '[':
                    stack.add('[');
                    sb.append(c);
                    break;
                case '}':
                    // Check if we have an opening brace to match
                    if (!stack.isEmpty()) {
                        char last = stack.get(stack.size() - 1);
                        if (last == '{') {
                            // Correct match
                            stack.remove(stack.size() - 1);
                            sb.append(c);
                        } else if (last == '[') {
                            // Error: We have a mismatch - found '}' but expected ']'
                            // Replace with the correct closing bracket
                            stack.remove(stack.size() - 1);
                            sb.append(']');
                            logger.warn("Fixed mismatched bracket: replaced '}' with ']' at position {}", i);
                        } else {
                            // Unexpected state
                            sb.append(c);
                        }
                    } else {
                        // No opening bracket/brace on stack
                        sb.append(c);
                    }
                    break;
                case ']':
                    // Check if we have an opening bracket to match
                    if (!stack.isEmpty()) {
                        char last = stack.get(stack.size() - 1);
                        if (last == '[') {
                            // Correct match
                            stack.remove(stack.size() - 1);
                            sb.append(c);
                        } else if (last == '{') {
                            // Error: We have a mismatch - found ']' but expected '}'
                            // Replace with the correct closing brace
                            stack.remove(stack.size() - 1);
                            sb.append('}');
                            logger.warn("Fixed mismatched bracket: replaced ']' with '}' at position {}", i);
                        } else {
                            // Unexpected state
                            sb.append(c);
                        }
                    } else {
                        // No opening bracket/brace on stack
                        sb.append(c);
                    }
                    break;
                default:
                    sb.append(c);
            }
        }

        // Handle any remaining unclosed brackets/braces
        if (!stack.isEmpty()) {
            logger.warn("Found {} unclosed brackets/braces", stack.size());

            // Add appropriate closing characters in reverse order
            for (int i = stack.size() - 1; i >= 0; i--) {
                char openChar = stack.get(i);
                if (openChar == '{') {
                    sb.append('}');
                } else if (openChar == '[') {
                    sb.append(']');
                }
            }

            logger.info("Added missing closing brackets/braces");
        }

        return sb.toString();
    }

    private CourseResponseDto createFallbackCourse(String initialTopic, Map<String, String> userAnswers) {
        initialTopic = inputSanitizer.sanitizeInput(initialTopic);

        CourseMetadataDto metadata = CourseMetadataDto.builder()
                .title("Course on " + initialTopic)
                .description("This is a basic course covering fundamental concepts of " + initialTopic + ".")
                .difficultyLevel("Mixed")
                .prerequisites(List.of("Basic understanding of the subject"))
                .build();

        List<ModuleDto> modules = new ArrayList<>();

        ModuleDto introModule = ModuleDto.builder()
                .moduleId("M1")
                .title("Introduction to " + initialTopic)
                .description("This module introduces the fundamental concepts of " + initialTopic + ".")
                .complexityLevel("Foundational")
                .duration("30 minutes")
                .learningObjectives(List.of(
                        "Understand basic concepts of " + initialTopic,
                        "Identify key terminology in " + initialTopic
                ))
                .keyTerms(List.of(
                        initialTopic + " fundamentals",
                        "Basic " + initialTopic + " concepts",
                        initialTopic + " introduction"
                ))
                .definitions(List.of(
                        initialTopic + " fundamentals: The core principles and basic concepts that form the foundation of " + initialTopic + ".",
                        "Basic " + initialTopic + " concepts: The essential ideas and terminology that anyone learning " + initialTopic + " needs to understand.",
                        initialTopic + " introduction: An overview of what " + initialTopic + " encompasses and why it's important to learn."
                ))
                .build();

        modules.add(introModule);

        ModuleDto coreModule = ModuleDto.builder()
                .moduleId("M2")
                .title("Core Concepts of " + initialTopic)
                .description("This module covers the essential components and frameworks of " + initialTopic + ".")
                .complexityLevel("Basic")
                .duration("45 minutes")
                .learningObjectives(List.of(
                        "Explore the main components of " + initialTopic,
                        "Apply basic principles to simple problems"
                ))
                .keyTerms(List.of(
                        initialTopic + " components",
                        initialTopic + " frameworks",
                        initialTopic + " applications"
                ))
                .definitions(List.of(
                        initialTopic + " components: The building blocks that make up the structure of " + initialTopic + ".",
                        initialTopic + " frameworks: Organized systems or approaches used to understand and work with " + initialTopic + ".",
                        initialTopic + " applications: Practical uses and implementations of " + initialTopic + " in real-world scenarios."
                ))
                .build();

        modules.add(coreModule);

        return CourseResponseDto.builder()
                .courseMetadata(metadata)
                .modules(modules)
                .build();
    }

    private Course saveCourse(CourseResponseDto courseResponseDto) {
        CourseMetadataDto meta = courseResponseDto.getCourseMetadata();

        Course course = new Course();
        course.setTitle(inputSanitizer.sanitizeInput(meta.getTitle()));
        course.setDescription(inputSanitizer.sanitizeInput(meta.getDescription()));
        course.setDifficultyLevel(inputSanitizer.sanitizeInput(meta.getDifficultyLevel()));

        if (meta.getPrerequisites() instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> rawPrereqList = (List<String>) meta.getPrerequisites();
            List<String> sanitizedPrereqList = rawPrereqList.stream()
                    .map(inputSanitizer::sanitizeInput)
                    .collect(Collectors.toList());
            course.setPrerequisites(sanitizedPrereqList);
        } else if (meta.getPrerequisites() != null) {
            String prereqString = meta.getPrerequisites().toString();
            prereqString = inputSanitizer.sanitizeInput(prereqString);
            List<String> prereqList = splitPrerequisitesString(prereqString);
            course.setPrerequisites(prereqList);
        } else {
            course.setPrerequisites(new ArrayList<>());
        }

        List<Module> modules = courseResponseDto.getModules()
                .stream()
                .map(moduleDto -> {
                    Module module = new Module();
                    module.setModuleId(inputSanitizer.sanitizeInput(moduleDto.getModuleId()));
                    module.setTitle(inputSanitizer.sanitizeInput(moduleDto.getTitle()));
                    module.setDescription(inputSanitizer.sanitizeInput(moduleDto.getDescription()));
                    module.setDuration(inputSanitizer.sanitizeInput(moduleDto.getDuration()));

                    if (moduleDto.getLearningObjectives() != null) {
                        List<String> sanitizedObjectives = moduleDto.getLearningObjectives().stream()
                                .map(inputSanitizer::sanitizeInput)
                                .collect(Collectors.toList());
                        module.setLearningObjectives(sanitizedObjectives);
                    } else {
                        module.setLearningObjectives(new ArrayList<>());
                    }

                    module.setComplexityLevel(inputSanitizer.sanitizeInput(moduleDto.getComplexityLevel()));

                    if (moduleDto.getKeyTerms() != null) {
                        List<String> sanitizedTerms = moduleDto.getKeyTerms().stream()
                                .map(inputSanitizer::sanitizeInput)
                                .collect(Collectors.toList());
                        module.setKeyTerms(sanitizedTerms);
                    } else {
                        module.setKeyTerms(new ArrayList<>());
                    }

                    if (moduleDto.getDefinitions() != null) {
                        List<String> sanitizedDefinitions = moduleDto.getDefinitions().stream()
                                .map(inputSanitizer::sanitizeInput)
                                .collect(Collectors.toList());
                        module.setDefinitions(sanitizedDefinitions);
                    } else {
                        module.setDefinitions(new ArrayList<>());
                    }

                    module.setCourse(course);
                    return module;
                })
                .collect(Collectors.toList());
        course.setModules(modules);

        Course saved = courseRepository.save(course);
        logger.info("Course saved with {} modules. DB ID: {}", modules.size(), saved.getId());
        return saved;
    }
}