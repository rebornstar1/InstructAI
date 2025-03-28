package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonParser;
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

    /**
     * ============ CREATE ============
     * Generates a course via Gemini API and persists it.
     */
    public CourseResponseDto generateCourse(CourseRequestDto request) {
        logger.info("Starting course generation for topic: {}", request.getTopic());

        // Enhanced prompt for better topic gradation and organization
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
                   - keyTerms: 4-5 important terms or concepts covered in this module
                   - learningObjectives: 3-5 specific, measurable objectives
                   - prerequisites: Any specific modules that should be completed before this one
                
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

    /**
     * ============ UPDATE ============
     * Updates an existing course by ID with the given CourseRequestDto.
     */
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
                   - keyTerms: 4-5 important terms or concepts covered in this module
                   - learningObjectives: 3-5 specific, measurable objectives
                   - prerequisites: Any specific modules that should be completed before this one
                
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
        existingCourse.setPrerequisites(meta.getPrerequisites());

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
                    module.setPrerequisiteModules(moduleDto.getPrerequisiteModules());
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

    // ----------------------------------------------------------------------
    // HELPER METHODS
    // ----------------------------------------------------------------------

    /**
     * Transforms the LLM-generated CourseResponseDto into a Course entity and persists it.
     */
    private Course saveCourse(CourseResponseDto courseResponseDto) {
        CourseMetadataDto meta = courseResponseDto.getCourseMetadata();

        Course course = new Course();
        course.setTitle(meta.getTitle());
        course.setDescription(meta.getDescription());
        course.setDifficultyLevel(meta.getDifficultyLevel());
        course.setPrerequisites(meta.getPrerequisites());

        List<Module> modules = courseResponseDto.getModules()
                .stream()
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
                    module.setPrerequisiteModules(moduleDto.getPrerequisiteModules());
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
                        .prerequisiteModules(module.getPrerequisiteModules())
                        .build())
                .collect(Collectors.toList());

        return CourseResponseDto.builder()
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

            logger.debug("Raw response from Gemini API: {}", rawResponse);

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

            return objectMapper.readValue(embeddedJson, CourseResponseDto.class);

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate course from Gemini API", e);
        }
    }
}