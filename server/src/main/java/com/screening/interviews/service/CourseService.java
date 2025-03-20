package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.dto.CourseRequestDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;

    /**
     * Generates a comprehensive course structure based on the user's request by sending a master prompt to Gemini.
     *
     * @param request CourseRequestDto containing topic, difficulty, moduleCount, etc.
     * @return a CourseResponseDto generated via the Gemini API
     */
    public CourseResponseDto generateCourse(CourseRequestDto request) {
        logger.info("Starting course generation for topic: {}", request.getTopic());

        // Build the robust master prompt.
        String masterPrompt = String.format("""
                Generate a comprehensive and personalized course structure for the topic: "%s". 
                The course should be designed for a learner with a basic understanding of the topic who aims to develop advanced skills. 
                Your response should include:
                1. Course Metadata:
                   - title: A concise course title.
                   - description: A brief description of the course content.
                   - difficultyLevel: Choose from Beginner, Intermediate, or Advanced.
                   - prerequisites: A list of prerequisites needed to begin this course.
                2. Modules: Generate %d modules. For each module, include:
                   - moduleId: A unique identifier.
                   - title: A module title that reflects a core concept of the topic.
                   - description: Detailed content for the module.
                   - duration: Estimated duration (e.g., "45 minutes").
                   - learningObjectives: A list of key learning objectives.
                Ensure the course structure follows a logical progression from foundational concepts to advanced topics.
                Return the result as a valid JSON object with keys "courseMetadata" and "modules".
                """, request.getTopic(), request.getModuleCount());

        if (logger.isDebugEnabled()) {
            logger.debug("Master prompt (truncated if long): {}",
                    masterPrompt.length() > 500 ? masterPrompt.substring(0, 500) + "... [truncated]" : masterPrompt);
        }

        CourseResponseDto result = generateCourseViaGemini(masterPrompt);

        if (result == null || (result.getCourseMetadata() == null && result.getModules() == null)) {
            logger.warn("Received empty or null course response from Gemini.");
        } else {
            logger.info("Successfully generated course. Title: {}",
                    result.getCourseMetadata() != null ? result.getCourseMetadata().getTitle() : "N/A");
        }

        return result;
    }

    /**
     * Calls Gemini with the master prompt, extracts the nested JSON from the "candidates" field,
     * and parses it into a CourseResponseDto.
     *
     * @param masterPrompt Detailed prompt describing how Gemini should format the course data
     * @return CourseResponseDto parsed from the Gemini response
     */
    private CourseResponseDto generateCourseViaGemini(String masterPrompt) {
        // Construct the minimal request body for Gemini.
        String payload = String.format("""
                {
                    "contents": [{
                        "parts": [{
                            "text": "%s"
                        }]
                    }]
                }
                """, masterPrompt.replace("\"", "\\\""));

        if (logger.isDebugEnabled()) {
            logger.debug("Sending payload to Gemini (truncated if long): {}",
                    payload.length() > 500 ? payload.substring(0, 500) + "... [truncated]" : payload);
        }

        try {
            logger.info("Calling Gemini API for course generation...");
            // 1. Call Gemini, get raw JSON.
            String rawResponse = geminiWebClient.post()
                    .uri("") // Already set in application.properties as part of the base URL
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            logger.debug("Raw response from Gemini API: {}", rawResponse);

            // 2. Parse the top-level Gemini structure to find the actual "text" field:
            JsonNode root = objectMapper.readTree(rawResponse);
            // Typically, the structure is "candidates" -> [0] -> "content" -> "parts" -> [0] -> "text"
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            // 3. The text field *should* contain the actual JSON for the course.
            String embeddedJson = textNode.asText();
            if (embeddedJson == null || embeddedJson.trim().isEmpty()) {
                logger.warn("Gemini's 'text' field is empty or missing. Raw response might not match the expected structure.");
                return null;
            }

            // Optional: Clean up triple backticks if the LLM included them.
            embeddedJson = embeddedJson.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            logger.debug("Extracted JSON to parse into CourseResponseDto: {}", embeddedJson);

            // 4. Parse the embedded JSON into our CourseResponseDto.
            CourseResponseDto dto = objectMapper.readValue(embeddedJson, CourseResponseDto.class);
            logger.info("Gemini API call successful. Parsed CourseResponseDto returned.");
            return dto;

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate course from Gemini API", e);
        }
    }
}
