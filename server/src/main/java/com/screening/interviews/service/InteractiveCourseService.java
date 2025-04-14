package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.CourseRequestDto;
import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.dto.InteractiveQuestionDto;
import com.screening.interviews.dto.InteractiveResponseDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class InteractiveCourseService {

    private static final Logger logger = LoggerFactory.getLogger(InteractiveCourseService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final CourseService courseService;

    // In-memory store for interactive sessions
    private final Map<String, Map<String, Object>> sessionStore = new ConcurrentHashMap<>();

    /**
     * Start a new interactive course creation session
     * @param topic Initial topic provided by the user
     * @return First set of questions based on the topic
     */
    public InteractiveQuestionDto startInteractiveSession(String topic) {
        logger.info("Starting interactive course creation session for topic: {}", topic);

        // Generate a unique session ID
        String sessionId = UUID.randomUUID().toString();

        // Initialize session data
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("topic", topic);
        sessionData.put("stage", 1);
        sessionData.put("answers", new HashMap<String, String>());

        // Store in session
        sessionStore.put(sessionId, sessionData);

        // Generate first set of questions based on topic
        InteractiveQuestionDto questions = generateQuestionsForStage(sessionId, 1, topic);
        questions.setSessionId(sessionId);

        return questions;
    }




    /**
     * Process user's answers and return the next set of questions or final response
     * @param sessionId The session identifier
     * @param answers User's answers to the previous questions
     * @return Next questions or final response
     */
    public InteractiveResponseDto processUserAnswers(String sessionId, Map<String, String> answers) {
        logger.info("Processing user answers for session: {}", sessionId);

        // Get session data
        Map<String, Object> sessionData = getSessionData(sessionId);
        String initialTopic = (String) sessionData.get("topic");

        // Update answers in session
        Map<String, String> currentAnswers = (Map<String, String>) sessionData.get("answers");
        currentAnswers.putAll(answers);

        // Get current stage and increment
        int currentStage = (int) sessionData.get("stage");
        int nextStage = currentStage + 1;
        sessionData.put("stage", nextStage);

        // Determine if this is the final stage
        boolean isFinalStage = nextStage > 3; // Assuming 3 stages of questions

        InteractiveResponseDto response = new InteractiveResponseDto();
        response.setSessionId(sessionId);

        if (isFinalStage) {
            // If final stage, indicate we're ready for course generation
            response.setComplete(true);
            response.setMessage("All questions answered! Ready to generate your personalized course.");
        } else {
            // Generate next set of questions based on previous answers
            // Pass the initial topic to maintain context
            InteractiveQuestionDto nextQuestions = generateQuestionsForStage(sessionId, nextStage, initialTopic);
            response.setComplete(false);
            response.setNextQuestions(nextQuestions);
        }

        return response;
    }

    /**
     * Generate questions dynamically based on the current stage and previous answers
     * @param sessionId The session identifier
     * @param stage Current stage of questioning
     * @param initialTopic Initial topic (used for all stages to maintain context)
     * @return Generated questions
     */
    private InteractiveQuestionDto generateQuestionsForStage(String sessionId, int stage, String initialTopic) {
        Map<String, Object> sessionData = sessionStore.get(sessionId);
        Map<String, String> previousAnswers = (Map<String, String>) sessionData.get("answers");

        // If the initialTopic is null, get it from the session
        // This is a fallback in case it wasn't passed properly
        if (initialTopic == null) {
            initialTopic = (String) sessionData.get("topic");
            logger.warn("Topic was null, retrieved from session: {}", initialTopic);
        }

        String prompt;

        switch (stage) {
            case 1:
                // First stage questions - focus on skill level and goals
                prompt = generateFirstStagePrompt(initialTopic);
                break;
            case 2:
                // Second stage questions - focus on specific areas and tech stack
                prompt = generateSecondStagePrompt(initialTopic, previousAnswers);
                break;
            case 3:
                // Third stage questions - focus on learning style and time constraints
                prompt = generateThirdStagePrompt(initialTopic, previousAnswers);
                break;
            default:
                throw new IllegalStateException("Invalid stage: " + stage);
        }

        // Call Gemini to generate questions
        return callGeminiForQuestions(prompt, stage);
    }
    /**
     * Generate the final course after all questions are answered
     * @param sessionId The session identifier
     * @return The generated course
     */
    public CourseResponseDto generateInteractiveCourse(String sessionId) {
        logger.info("Generating interactive course for session: {}", sessionId);

        Map<String, Object> sessionData = getSessionData(sessionId);
        Map<String, String> allAnswers = (Map<String, String>) sessionData.get("answers");
        String initialTopic = (String) sessionData.get("topic");

        // Create optimized course request based on all gathered information
        CourseRequestDto request = buildEnhancedCourseRequest(initialTopic, allAnswers);

        // Generate the course
        CourseResponseDto courseResponse = courseService.generateCourse(request);

        // Clean up session data
        sessionStore.remove(sessionId);

        return courseResponse;
    }

    private String generateFirstStagePrompt(String topic) {
        return String.format("""
        You are an expert educational AI helping to design a personalized course about "%s".
        
        To create a tailored learning experience about %s, you need to ask the user important background questions that will help customize their learning journey effectively.
        
        Generate 3-4 questions focused on:
        1. Their current skill/knowledge level with %s (from complete beginner to advanced)
        2. Their primary goals or what they want to achieve by learning %s
        3. Their available time commitment for learning %s (hours per week, overall timeframe)
        4. Their preferred balance between theoretical knowledge and practical application in %s
        
        For each question, provide 3-5 specific answer options that:
        - Are directly relevant to mainstream aspects of %s
        - Cover a broad range of skill levels from beginner to advanced
        - Focus on widely documented concepts and skills that have ample learning resources available
        - Avoid overly niche or highly specialized segments that might lack sufficient learning materials
                    
        Format your response as a valid JSON object with this exact structure:
        {
          "title": "Let's customize your %s learning journey",
          "description": "To create your personalized %s course, I'll need to understand your background, goals, and preferences.",
          "questions": [
            {
              "id": "skill_level",
              "question": "What best describes your current knowledge of %s?",
              "options": ["Complete beginner with no prior exposure to %s", "Beginner with some basic familiarity with %s concepts", "Intermediate understanding of %s fundamentals", "Advanced knowledge seeking to deepen specific %s skills"]
            },
            {
              "id": "primary_goal",
              "question": "What is your main goal for learning %s?",
              "options": ["Option 1 related to common applications of %s", "Option 2 related to common applications of %s", "Option 3 related to common applications of %s", "Option 4 related to common applications of %s"]
            }
          ]
        }
        
        Make questions relevant to %s but ensure they're focused on mainstream aspects that have abundant learning resources available. The options should cover a range from beginner to advanced levels to accommodate different learners.
        """, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic);
    }

    /**
     * Generate prompt for the second stage questions with focus on practical learning path construction
     */
    private String generateSecondStagePrompt(String topic, Map<String, String> previousAnswers) {
        return String.format("""
        You are an expert educational AI helping to design a personalized course about "%s".
        
        The user has provided these answers to previous questions about %s:
        %s
        
        Based on these answers, generate 3-4 more specific questions focusing on:
        1. Which mainstream subtopics or fundamental areas of %s they want to prioritize
        2. Which widely-used %s tools, frameworks, or methodologies they're interested in learning
        3. What specific types of projects or exercises they'd prefer for practicing %s skills
        4. How they prefer to measure their progress when learning %s
        
        For each question, provide 3-5 specific answer options that:
        - Focus on well-established, widely-documented aspects of %s
        - Align with the user's previously indicated skill level and goals
        - Represent topics with abundant learning resources and tutorials available online
        - Cover a reasonable progression path for their indicated level of expertise
        
        Format your response as a valid JSON object with this exact structure:
        {
          "title": "Let's structure your %s learning path",
          "description": "Based on your background, let's determine what specific aspects of %s to focus on.",
          "questions": [
            {
              "id": "content_priorities",
              "question": "Which areas of %s would you like to prioritize in your learning?",
              "options": ["Fundamental %s concepts and principles", "Practical %s applications and implementations", "Advanced %s techniques and optimizations", "Comprehensive coverage of both basics and advanced %s topics"]
            }
          ]
        }
        
        Keep the questions focused on mainstream %s knowledge that has sufficient learning resources available online. Avoid overly specialized or niche areas that might be difficult to find comprehensive materials for.
        """, topic, topic, formatPreviousAnswers(previousAnswers), topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic);
    }

    /**
     * Generate prompt for the third stage questions with focus on learning style and practical implementation
     */
    private String generateThirdStagePrompt(String topic, Map<String, String> previousAnswers) {
        return String.format("""
        You are an expert educational AI helping to design a personalized course about "%s".
        
        The user has provided these answers about their %s learning preferences:
        %s
        
        Based on all their answers so far, generate 2-3 final questions focusing on:
        1. Their preferred learning formats for %s (videos, interactive exercises, reading materials, projects)
        2. How they want to balance theory and practice in their %s learning journey
        3. What level of guidance they need when learning %s (step-by-step instructions vs. exploratory challenges)
        4. How they prefer to apply their %s knowledge (following structured examples vs. creative projects)
        
        For each question, provide 3-5 specific answer options that:
        - Accommodate different learning styles while remaining practical for %s education
        - Focus on approaches that can be implemented with readily available learning resources
        - Can be adapted to different skill levels based on their previous answers
        - Will help create a well-rounded learning experience for mainstream %s topics
        
        Format your response as a valid JSON object with this exact structure:
        {
          "title": "Finalizing your %s learning experience",
          "description": "Let's determine the best way to deliver your personalized %s course.",
          "questions": [
            {
              "id": "learning_format",
              "question": "How do you prefer to learn %s concepts?",
              "options": ["Through comprehensive text explanations with examples", "Through video tutorials and demonstrations", "Through interactive coding/practice exercises", "Through a mix of different formats"]
            }
          ]
        }
        
        Keep the focus on creating a practical and achievable %s learning experience using widely available resources and formats. The goal is to create a customized course that can be effectively delivered with existing educational materials.
        """, topic, topic, formatPreviousAnswers(previousAnswers), topic, topic, topic, topic, topic, topic, topic, topic, topic, topic, topic);
    }

    /**
     * Format previous answers for inclusion in prompts with better context
     */
    private String formatPreviousAnswers(Map<String, String> answers) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : answers.entrySet()) {
            String readableKey = entry.getKey().replace("_", " ").trim();
            sb.append("- ").append(readableKey).append(": ").append(entry.getValue()).append("\n");
        }
        return sb.toString();
    }

    /**
     * Build an enhanced course request based on all gathered user information
     */
    private CourseRequestDto buildEnhancedCourseRequest(String initialTopic, Map<String, String> allAnswers) {
        // Prepare information for a detailed course prompt
        StringBuilder topicDetails = new StringBuilder();
        topicDetails.append("Topic: ").append(initialTopic).append("\n\n");
        topicDetails.append("Learner Profile:\n");

        // Categorize answers for better prompt construction
        Map<String, List<String>> categorizedAnswers = categorizeAnswers(allAnswers);

        // Add skill level information
        if (categorizedAnswers.containsKey("skill")) {
            topicDetails.append("Skill Level: ").append(String.join(", ", categorizedAnswers.get("skill"))).append("\n");
        }

        // Add goals information
        if (categorizedAnswers.containsKey("goal")) {
            topicDetails.append("Learning Goals: ").append(String.join(", ", categorizedAnswers.get("goal"))).append("\n");
        }

        // Add focus areas
        if (categorizedAnswers.containsKey("focus")) {
            topicDetails.append("Focus Areas: ").append(String.join(", ", categorizedAnswers.get("focus"))).append("\n");
        }

        // Add preferred technologies
        if (categorizedAnswers.containsKey("tech")) {
            topicDetails.append("Technologies/Tools: ").append(String.join(", ", categorizedAnswers.get("tech"))).append("\n");
        }

        // Add learning style
        if (categorizedAnswers.containsKey("style")) {
            topicDetails.append("Learning Style: ").append(String.join(", ", categorizedAnswers.get("style"))).append("\n");
        }

        // Add time constraints
        if (categorizedAnswers.containsKey("time")) {
            topicDetails.append("Time Constraints: ").append(String.join(", ", categorizedAnswers.get("time"))).append("\n");
        }

        // Add any other information
        topicDetails.append("\nAdditional Details:\n");
        for (Map.Entry<String, String> entry : allAnswers.entrySet()) {
            if (!categorizedAnswers.containsKey(entry.getKey().split("_")[0])) {
                topicDetails.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
        }

        // Create course request with the enhanced topic information
        CourseRequestDto request = new CourseRequestDto();
        request.setTopic(topicDetails.toString());

        // Determine appropriate difficulty level based on user's skill level
        if (categorizedAnswers.containsKey("skill")) {
            String skillLevel = categorizedAnswers.get("skill").get(0).toLowerCase();
            if (skillLevel.contains("beginner")) {
                request.setDifficultyLevel("Beginner");
            } else if (skillLevel.contains("intermediate")) {
                request.setDifficultyLevel("Intermediate");
            } else if (skillLevel.contains("advanced") || skillLevel.contains("expert")) {
                request.setDifficultyLevel("Advanced");
            } else {
                request.setDifficultyLevel("Mixed");
            }
        } else {
            request.setDifficultyLevel("Mixed");
        }

        return request;
    }

    /**
     * Categorize answers for better prompt construction
     */
    private Map<String, List<String>> categorizeAnswers(Map<String, String> allAnswers) {
        Map<String, List<String>> categorized = new HashMap<>();

        for (Map.Entry<String, String> entry : allAnswers.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            // Extract category from question ID (e.g., skill_level -> skill)
            String category = key.split("_")[0];

            categorized.computeIfAbsent(category, k -> new ArrayList<>()).add(value);
        }

        return categorized;
    }

    /**
     * Call Gemini API to generate interactive questions
     */
    private InteractiveQuestionDto callGeminiForQuestions(String prompt, int stage) {
        try {
            String escapedPrompt = objectMapper.writeValueAsString(prompt);
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

            logger.info("Calling Gemini API for interactive questions generation (stage {})...", stage);
            String rawResponse = geminiWebClient.post()
                    .uri("") // Base URL set in application.properties
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Extract and clean the response JSON
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String embeddedJson = textNode.asText();
            embeddedJson = embeddedJson.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Parse the response into our DTO
            return objectMapper.readValue(embeddedJson, InteractiveQuestionDto.class);

        } catch (Exception e) {
            logger.error("Error generating interactive questions: {}", e.getMessage(), e);
            // Return a fallback set of questions
            return generateFallbackQuestions(stage);
        }
    }
    /**
     * Generate fallback questions in case of API failure
     */
    private InteractiveQuestionDto generateFallbackQuestions(int stage) {
        InteractiveQuestionDto fallback = new InteractiveQuestionDto();
        fallback.setTitle("Let's customize your course");
        fallback.setDescription("Please answer these questions to help us personalize your learning experience.");

        List<Map<String, Object>> questions = new ArrayList<>();

        if (stage == 1) {
            Map<String, Object> q1 = new HashMap<>();
            q1.put("id", "skill_level");
            q1.put("question", "What is your current skill level with this topic?");
            q1.put("options", Arrays.asList("Complete beginner", "Some basic knowledge", "Intermediate", "Advanced"));

            Map<String, Object> q2 = new HashMap<>();
            q2.put("id", "primary_goal");
            q2.put("question", "What is your primary goal for learning this topic?");
            q2.put("options", Arrays.asList("Personal interest", "School/Academic", "Professional development", "Career change"));

            questions.add(q1);
            questions.add(q2);
        } else if (stage == 2) {
            Map<String, Object> q1 = new HashMap<>();
            q1.put("id", "focus_area");
            q1.put("question", "Which aspect of this topic would you like to focus on the most?");
            q1.put("options", Arrays.asList("Practical applications", "Theoretical foundations", "Latest developments", "All aspects equally"));

            questions.add(q1);
        } else {
            Map<String, Object> q1 = new HashMap<>();
            q1.put("id", "learning_style");
            q1.put("question", "What is your preferred learning style?");
            q1.put("options", Arrays.asList("Hands-on projects", "Video tutorials", "Reading materials", "Interactive exercises"));

            questions.add(q1);
        }

        fallback.setQuestions(questions);
        return fallback;
    }

    /**
     * Get session data with validation
     */
    private Map<String, Object> getSessionData(String sessionId) {
        Map<String, Object> sessionData = sessionStore.get(sessionId);
        if (sessionData == null) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }
        return sessionData;
    }
}