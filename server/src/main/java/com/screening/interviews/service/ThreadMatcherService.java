package com.screening.interviews.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.CourseMetadataDto;
import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.dto.community.ThreadDTO;
import com.screening.interviews.model.Course;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThreadMatcherService {

    private static final Logger logger = LoggerFactory.getLogger(ThreadMatcherService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final ThreadService threadService;

    /**
     * Finds relevant threads for a course using AI analysis
     * @param courseResponseDto The course data to analyze
     * @return List of thread IDs that are relevant to the course
     */
    public List<Long> findRelevantThreads(CourseResponseDto courseResponseDto) {
        logger.info("Finding relevant threads for course: {}", courseResponseDto.getCourseMetadata().getTitle());

        // Fetch all available threads
        List<ThreadDTO> allThreads = threadService.getAllMainThreads();

        if (allThreads.isEmpty()) {
            logger.info("No threads available to match against");
            return List.of();
        }

        // Format thread data for the prompt
        String threadData = formatThreadsForPrompt(allThreads);

        // Create prompt for Gemini to analyze and match threads
        String prompt = createThreadMatchingPrompt(courseResponseDto, threadData);

        // Get thread recommendations from Gemini
        List<Long> recommendedThreadIds = queryGeminiForThreadMatches(prompt);

        logger.info("Found {} relevant threads for course: {}",
                recommendedThreadIds.size(),
                courseResponseDto.getCourseMetadata().getTitle());

        return recommendedThreadIds;
    }

    /**
     * Associates a course with its relevant threads
     * @param course The course entity to link
     * @param relevantThreadIds List of thread IDs to link with the course
     */
    public void associateCourseWithThreads(Course course, List<Long> relevantThreadIds) {
        if (relevantThreadIds == null || relevantThreadIds.isEmpty()) {
            logger.info("No relevant threads to associate with course ID: {}", course.getId());
            return;
        }

        logger.info("Associating course ID: {} with {} threads", course.getId(), relevantThreadIds.size());

        for (Long threadId : relevantThreadIds) {
            try {
                threadService.addCourseToThread(threadId, course.getId());
                logger.info("Added course ID: {} to thread ID: {}", course.getId(), threadId);
            } catch (Exception e) {
                logger.error("Failed to add course ID: {} to thread ID: {}: {}",
                        course.getId(), threadId, e.getMessage(), e);
            }
        }
    }

    /**
     * Formats thread data into a string for the AI prompt
     */
    private String formatThreadsForPrompt(List<ThreadDTO> threads) {
        StringBuilder sb = new StringBuilder();
        for (ThreadDTO thread : threads) {
            sb.append("Thread ID: ").append(thread.getId())
                    .append("\nName: ").append(thread.getName())
                    .append("\nDescription: ").append(thread.getDescription())
                    .append("\n\n");
        }
        return sb.toString();
    }

    /**
     * Creates a prompt for Gemini to analyze course-thread relevance
     */
    private String createThreadMatchingPrompt(CourseResponseDto course, String threadData) {
        CourseMetadataDto meta = course.getCourseMetadata();

        return String.format("""
            Analyze the following course and determine which community threads are most relevant to it.
            
            COURSE INFORMATION:
            Title: %s
            Description: %s
            Difficulty Level: %s
            
            KEY MODULES:
            %s
            
            AVAILABLE THREADS:
            %s
            
            TASK:
            1. Analyze the course content, learning objectives, and key topics
            2. Review each available thread to determine relevance to this course
            3. Select ONLY threads that have a STRONG thematic match to the course
            4. Return ONLY the IDs of relevant threads as a JSON array of numbers, like: [1, 4, 7]
            5. If no threads are relevant, return an empty array: []
            
            IMPORTANT:
            - Only include threads with strong topical relevance
            - Return ONLY the thread IDs in a valid JSON array format
            - DO NOT include any explanatory text, ONLY the JSON array
            """,
                meta.getTitle(),
                meta.getDescription(),
                meta.getDifficultyLevel(),
                formatModulesForPrompt(course),
                threadData
        );
    }

    /**
     * Formats key module information for the AI prompt
     */
    private String formatModulesForPrompt(CourseResponseDto course) {
        StringBuilder sb = new StringBuilder();
        // Include only a subset of modules to keep the prompt size reasonable
        int moduleLimit = Math.min(course.getModules().size(), 5);

        for (int i = 0; i < moduleLimit; i++) {
            var module = course.getModules().get(i);
            sb.append("- ").append(module.getTitle())
                    .append(": ").append(module.getDescription());

            if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty()) {
                sb.append(" Key terms: ").append(String.join(", ", module.getKeyTerms()));
            }

            sb.append("\n");
        }

        return sb.toString();
    }

    /**
     * Calls Gemini API to get thread recommendations
     */
    private List<Long> queryGeminiForThreadMatches(String prompt) {
        try {
            // Escape the prompt to ensure special characters are handled
            String escapedPrompt = objectMapper.writeValueAsString(prompt);
            // Remove the surrounding quotes
            escapedPrompt = escapedPrompt.substring(1, escapedPrompt.length() - 1);

            String payload = String.format("""
            {
                "contents": [{
                    "parts": [{
                        "text": "%s"
                    }]
                }]
            }
            """, escapedPrompt);

            logger.info("Calling Gemini API for thread matching...");
            String rawResponse = geminiWebClient.post()
                    .uri("") // Base URL set in application.properties
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Process the response to extract the thread IDs
            return extractThreadIdsFromResponse(rawResponse);

        } catch (Exception e) {
            logger.error("Error calling Gemini API for thread matching: {}", e.getMessage(), e);
            return List.of(); // Return empty list on error
        }
    }

    /**
     * Extracts thread IDs from the Gemini API response
     */
    private List<Long> extractThreadIdsFromResponse(String rawResponse) {
        try {
            // Extract the text content from the Gemini response
            var root = objectMapper.readTree(rawResponse);
            var textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String content = textNode.asText().trim();

            // Clean up the response - find the JSON array
            int startBracket = content.indexOf('[');
            int endBracket = content.lastIndexOf(']');

            if (startBracket != -1 && endBracket != -1 && endBracket > startBracket) {
                String jsonArray = content.substring(startBracket, endBracket + 1);

                // Parse the JSON array to get the thread IDs
                Long[] threadIds = objectMapper.readValue(jsonArray, Long[].class);
                return List.of(threadIds);
            } else {
                logger.warn("No valid JSON array found in Gemini response: {}", content);
                return List.of();
            }
        } catch (Exception e) {
            logger.error("Error parsing thread IDs from Gemini response: {}", e.getMessage(), e);
            return List.of();
        }
    }
}