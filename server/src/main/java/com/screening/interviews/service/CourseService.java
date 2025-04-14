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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final CourseRepository courseRepository;
    private final ThreadMatcherService threadMatcherService;

    /**
     * ============ CREATE ============
     * Generates a course via Gemini API and persists it.
     */
    public CourseResponseDto generateCourse(CourseRequestDto request) {
        logger.info("Starting course generation for topic: {}", request.getTopic());

        // Enhanced prompt that includes key term generation
        String masterPrompt = String.format("""
                Generate a comprehensive and pedagogically sound course structure for the topic: "%s". 
                
                First, analyze the topic thoroughly to:
                1. Identify all core concepts and sub-topics that need to be covered for complete mastery
                2. Determine the natural learning progression from fundamental to advanced concepts
                3. Identify key dependencies between concepts (what must be learned before other topics)
                4. Break down complex ideas into digestible, searchable modules
                
                Then, create a complete course structure that:
                
                1. Course Metadata:
                   - title: A concise, descriptive course title
                   - description: A detailed description that outlines the scope, purpose, and intended audience
                   - difficultyLevel: Overall difficulty (Beginner, Intermediate, Advanced, or Mixed)
                   - prerequisites: Specific knowledge or skills needed before starting this course
                
                2. Modules: Create a COMPREHENSIVE set of modules to fully cover the topic with proper gradation:
                   - Ensure progression from foundational to advanced concepts
                   - Each module should build upon previous modules
                   - Use clear knowledge dependencies (don't introduce advanced concepts before their prerequisites)
                   - Break large topics into smaller, focused modules for better searchability 
                   - Ensure each module has a specific, well-defined scope
                   
                   For each module, include:
                   - moduleId: A sequential identifier (M1, M2, etc.)
                   - title: A specific, searchable title that clearly identifies the module's content
                   - description: Detailed content description (4-6 sentences)
                   - complexityLevel: Individual module complexity (Foundational, Basic, Intermediate, Advanced, Expert)
                   - duration: Estimated time to complete (e.g., "30 minutes", "1 hour")
                   - learningObjectives: 3-5 specific, measurable objectives
                   - prerequisites: Any specific modules that should be completed before this one
                   
                   IMPORTANT: For each module, also include:
                   - keyTerms: An array of 5-7 important terms/concepts that learners should master in this module
                   - definitions: An array of clear 1-2 sentence definitions for each key term (same order as keyTerms)
                
                Return the result as a valid JSON object with keys "courseMetadata" and "modules".
                
                Remember: Focus on comprehensive coverage and proper educational sequencing rather than limiting the number of modules.
                Create as many modules as needed to cover the topic thoroughly while ensuring each module is focused and digestible.
                """, request.getTopic());

        CourseResponseDto result = generateCourseViaGemini(masterPrompt);

        if (result == null || (result.getCourseMetadata() == null && result.getModules() == null)) {
            logger.warn("Received empty or null course response from Gemini.");
            return null;
        }

        // Persist the data in the DB
        Course savedCourse = saveCourse(result);

        List<Long> relevantThreadIds = threadMatcherService.findRelevantThreads(result);

        // Associate the course with these threads
        threadMatcherService.associateCourseWithThreads(savedCourse, relevantThreadIds);

        // Optionally return the saved course mapped back to a response.
        return mapEntityToCourseResponseDto(savedCourse);
    }

    /**
     * ============ READ ============
     * Returns a single course by ID as a CourseResponseDto.
     */
    public CourseResponseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
        return mapEntityToCourseResponseDto(course);
    }

    public List<CourseResponseDto> getAllCourses() {
        logger.info("Fetching all courses");
        List<Course> courses = courseRepository.findAll();
        return courses.stream()
                .map(this::mapEntityToCourseResponseDto)
                .collect(Collectors.toList());
    }


    public CourseResponseDto updateCourse(Long id, CourseRequestDto request) {
        // 1) Find existing course.
        Course existingCourse = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));

        // 2) Generate an updated course structure via Gemini with enhanced prompt
        String masterPrompt = String.format("""
            Generate a comprehensive and pedagogically sound course structure for the topic: "%s". 
            
            First, analyze the topic thoroughly to:
            1. Identify all core concepts and sub-topics that need to be covered for complete mastery
            2. Determine the natural learning progression from fundamental to advanced concepts
            3. Identify key dependencies between concepts (what must be learned before other topics)
            4. Break down complex ideas into digestible, searchable modules
            
            Then, create a complete course structure that:
            
            1. Course Metadata:
               - title: A concise, descriptive course title
               - description: A detailed description that outlines the scope, purpose, and intended audience
               - difficultyLevel: Overall difficulty (Beginner, Intermediate, Advanced, or Mixed)
               - prerequisites: Specific knowledge or skills needed before starting this course
            
            2. Modules: Create a COMPREHENSIVE set of modules to fully cover the topic with proper gradation:
               - Ensure progression from foundational to advanced concepts
               - Each module should build upon previous modules
               - Use clear knowledge dependencies (don't introduce advanced concepts before their prerequisites)
               - Break large topics into smaller, focused modules for better searchability 
               - Ensure each module has a specific, well-defined scope
               
               For each module, include:
               - moduleId: A sequential identifier (M1, M2, etc.)
               - title: A specific, searchable title that clearly identifies the module's content
               - description: Detailed content description (4-6 sentences)
               - complexityLevel: Individual module complexity (Foundational, Basic, Intermediate, Advanced, Expert)
               - duration: Estimated time to complete (e.g., "30 minutes", "1 hour")
               - learningObjectives: 3-5 specific, measurable objectives
               - prerequisites: Any specific modules that should be completed before this one
               
               IMPORTANT: For each module, also include:
               - keyTerms: An array of 5-7 important terms/concepts that learners should master in this module
               - definitions: An array of clear 1-2 sentence definitions for each key term (same order as keyTerms)
            
            Return the result as a valid JSON object with keys "courseMetadata" and "modules".
            
            Remember: Focus on comprehensive coverage and proper educational sequencing rather than limiting the number of modules.
            Create as many modules as needed to cover the topic thoroughly while ensuring each module is focused and digestible.
            """, request.getTopic());

        CourseResponseDto updatedDto = generateCourseViaGemini(masterPrompt);
        if (updatedDto == null) {
            throw new RuntimeException("Failed to get updated course info from Gemini.");
        }

        // Update metadata.
        CourseMetadataDto meta = updatedDto.getCourseMetadata();
        existingCourse.setTitle(meta.getTitle());
        existingCourse.setDescription(meta.getDescription());
        existingCourse.setDifficultyLevel(meta.getDifficultyLevel());

        // Handle prerequisites which might be a String or a List<String>
        if (meta.getPrerequisites() instanceof List) {
            // If it's already a list, use it directly
            @SuppressWarnings("unchecked")
            List<String> prereqList = (List<String>) meta.getPrerequisites();
            existingCourse.setPrerequisites(prereqList);
        } else if (meta.getPrerequisites() != null) {
            // If it's a string, convert it to a list using our helper method
            String prereqString = meta.getPrerequisites().toString();
            List<String> prereqList = splitPrerequisitesString(prereqString);
            existingCourse.setPrerequisites(prereqList);
        } else {
            // If null, use an empty list
            existingCourse.setPrerequisites(new ArrayList<>());
        }

        // Clear out old modules.
        existingCourse.getModules().clear();

        // Rebuild modules from updatedDto.
        List<Module> newModules = updatedDto.getModules().stream()
                .map(moduleDto -> {
                    Module module = new Module();
                    module.setModuleId(moduleDto.getModuleId());
                    module.setTitle(moduleDto.getTitle());
                    module.setDescription(moduleDto.getDescription());
                    module.setDuration(moduleDto.getDuration());
                    module.setLearningObjectives(moduleDto.getLearningObjectives());
                    // Add new fields
                    module.setComplexityLevel(moduleDto.getComplexityLevel());
                    module.setKeyTerms(moduleDto.getKeyTerms());
                    module.setDefinitions(moduleDto.getDefinitions());
                    module.setCourse(existingCourse);
                    return module;
                })
                .collect(Collectors.toList());
        existingCourse.getModules().addAll(newModules);

        // 3) Save updated course.
        Course saved = courseRepository.save(existingCourse);
        return mapEntityToCourseResponseDto(saved);
    }
    /**
     * ============ DELETE ============
     * Deletes a course (and cascades to all its modules).
     */
    public void deleteCourse(Long id) {
        Optional<Course> optional = courseRepository.findById(id);
        if (optional.isEmpty()) {
            throw new RuntimeException("Course not found with ID: " + id);
        }
        courseRepository.delete(optional.get());
        logger.info("Course deleted with ID: {}", id);
    }

    /**
     * Transforms the LLM-generated CourseResponseDto into a Course entity and persists it.
     */
    private Course saveCourse(CourseResponseDto courseResponseDto) {
        CourseMetadataDto meta = courseResponseDto.getCourseMetadata();

        Course course = new Course();
        course.setTitle(meta.getTitle());
        course.setDescription(meta.getDescription());
        course.setDifficultyLevel(meta.getDifficultyLevel());

        // Handle prerequisites which might be a String or a List<String>
        if (meta.getPrerequisites() instanceof List) {
            // If it's already a list, use it directly
            @SuppressWarnings("unchecked")
            List<String> prereqList = (List<String>) meta.getPrerequisites();
            course.setPrerequisites(prereqList);
        } else if (meta.getPrerequisites() != null) {
            // If it's a string, convert it to a list using our helper method
            String prereqString = meta.getPrerequisites().toString();
            List<String> prereqList = splitPrerequisitesString(prereqString);
            course.setPrerequisites(prereqList);
        } else {
            // If null, use an empty list
            course.setPrerequisites(new ArrayList<>());
        }

        List<Module> modules = courseResponseDto.getModules()
                .stream()
                .map(moduleDto -> {
                    Module module = new Module();
                    module.setModuleId(moduleDto.getModuleId());
                    module.setTitle(moduleDto.getTitle());
                    module.setDescription(moduleDto.getDescription());
                    module.setDuration(moduleDto.getDuration());
                    module.setLearningObjectives(moduleDto.getLearningObjectives());
                    // Add key terms and definitions
                    module.setKeyTerms(moduleDto.getKeyTerms());
                    module.setDefinitions(moduleDto.getDefinitions());
                    // Add complexity level
                    module.setComplexityLevel(moduleDto.getComplexityLevel());
                    module.setCourse(course);
                    return module;
                })
                .collect(Collectors.toList());
        course.setModules(modules);

        Course saved = courseRepository.save(course);
        logger.info("Course saved with {} modules. DB ID: {}", modules.size(), saved.getId());
        return saved;
    }

    /**
     * Maps a Course entity to the CourseResponseDto to return to the client.
     */
    private CourseResponseDto mapEntityToCourseResponseDto(Course course) {
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
                .id(course.getId())                  // Include the course ID
                .courseUuid(course.getCourseUuid())  // Include the course UUID
                .courseMetadata(courseMetadataDto)
                .modules(moduleDtos)
                .build();
    }

    /**
     * Calls Gemini with the master prompt, cleans the response of any extraneous characters,
     * and parses it into a CourseResponseDto.
     */
    private CourseResponseDto generateCourseViaGemini(String masterPrompt) {
        // Escape the masterPrompt to ensure special characters are handled.
        String escapedPrompt;
        try {
            // Create a JSON string literal for the prompt.
            escapedPrompt = objectMapper.writeValueAsString(masterPrompt);
            // Remove the surrounding quotes.
            escapedPrompt = escapedPrompt.substring(1, escapedPrompt.length() - 1);
        } catch (Exception e) {
            throw new RuntimeException("Failed to escape master prompt", e);
        }

        String payload = String.format("""
    {
        "contents": [{
            "parts": [{
                "text": "%s"
            }]
        }]
    }
    """, escapedPrompt);

        try {
            logger.info("Calling Gemini API for course generation...");
            String rawResponse = geminiWebClient.post()
                    .uri("") // Base URL set in application.properties.
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Log only partial response to avoid flooding logs
            if (rawResponse != null && rawResponse.length() > 500) {
                logger.debug("Raw response from Gemini API (first 500 chars): {}", rawResponse.substring(0, 500) + "...");
            } else {
                logger.debug("Raw response from Gemini API: {}", rawResponse);
            }

            // Remove any lines starting with '#' (YAML-style comments).
            rawResponse = rawResponse.replaceAll("(?m)^#.*", "").trim();

            // In case the response contains a prefix before the JSON (e.g. "Okay ..."),
            // find the first '{' and use that substring.
            int jsonStart = rawResponse.indexOf('{');
            if (jsonStart != -1) {
                rawResponse = rawResponse.substring(jsonStart);
            } else {
                throw new RuntimeException("No JSON object found in Gemini API response");
            }

            // Allow JSON comments to be skipped (if any still remain).
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

            // Clean up triple backticks if present.
            embeddedJson = embeddedJson.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Try to parse the response, applying multiple repair attempts if needed
            try {
                // First, try to parse the response as is
                return objectMapper.readValue(embeddedJson, CourseResponseDto.class);
            } catch (JsonMappingException jme) {
                // If parsing fails, log details and attempt to repair the JSON
                logger.warn("Failed to parse Gemini response JSON. Attempting fixes: {}", jme.getMessage());

                try {
                    // Step 1: Apply basic fixes
                    String fixedJson = fixTrailingCommas(embeddedJson);
                    fixedJson = ensureKeyTermsAndDefinitions(fixedJson);
                    return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                } catch (Exception e1) {
                    logger.warn("Basic fixes failed. Attempting advanced bracket repair: {}", e1.getMessage());

                    try {
                        // Step 2: Apply more advanced bracket matching fixes
                        String fixedJson = fixJsonBracketMismatches(embeddedJson);
                        return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                    } catch (Exception e2) {
                        logger.warn("Advanced fixes failed. Attempting last-resort fixes: {}", e2.getMessage());

                        // Step 3: Last resort - try all fixes in combination
                        String fixedJson = fixTrailingCommas(embeddedJson);
                        fixedJson = fixJsonBracketMismatches(fixedJson);
                        fixedJson = ensureKeyTermsAndDefinitions(fixedJson);

                        // Try to parse again
                        return objectMapper.readValue(fixedJson, CourseResponseDto.class);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate course from Gemini API", e);
        }
    }
    /**
     * Fix issue with unbalanced array brackets by scanning and balancing them
     */
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

    /**
     * Fix trailing commas in JSON objects and arrays
     */
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

    /**
     * Ensure each module has keyTerms and definitions fields, adding empty arrays if missing
     */
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

    /**
     * Helper method to intelligently split a prerequisites string into a list
     * This can be added to your service class or as a utility method
     */
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

    /**
     * Advanced JSON repair function that specifically targets mismatched brackets
     * This handles the case where ']' appears when '}' was expected
     */
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
}