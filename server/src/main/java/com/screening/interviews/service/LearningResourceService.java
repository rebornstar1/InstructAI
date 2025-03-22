package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.SubModuleDto;
import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.dto.QuestionDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private static final Logger logger = LoggerFactory.getLogger(LearningResourceService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;

    private static final String YOUTUBE_API_KEY = "AIzaSyCItvhHeCz5v3eQRp3SziAvHk-2XUUKg1Q";

    // Optionally, you could store your base URL in application.properties
    // but for simplicity, we define it here:
    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    /**
     * Generates a comprehensive learning resource based on the user's request by sending enhanced
     * educational prompts to Gemini, plus searching for a relevant YouTube video link.
     *
     * @param request LearningResourceRequestDto containing conceptTitle, moduleTitle, etc.
     * @return a LearningResourceDto with main content, submodules, quizzes, transcript, and a YouTube video URL
     */
    public LearningResourceDto generateLearningResource(LearningResourceRequestDto request) {
        String conceptTitle = request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle();
        String moduleTitle = request.getModuleTitle();

        logger.info("Starting learning resource generation for concept: {}, module: {}", conceptTitle, moduleTitle);

        // 1) Generate main content using Gemini
        String mainContentPrompt = String.format(
                "Create a comprehensive learning resource about '%s' in markdown format for module '%s'. "
                        + "The content should be approximately 400-500 words or about 5-7 minutes of reading time. "

                        + "Follow this educational structure: "
                        + "1. Start with clear learning objectives that state exactly what the reader will learn "
                        + "2. Write an engaging introduction that provides context and explains why this topic matters "
                        + "3. Include conceptual definitions for all key terms to build a solid foundation "
                        + "4. Break down complex ideas with detailed step-by-step explanations "
                        + "5. Illustrate with at least 2 real-world examples or case studies "
                        + "6. Describe visual aids that would enhance understanding (in markdown, describe what the image would show) "
                        + "7. Add 2-3 reflective questions that encourage readers to apply the concepts "
                        + "8. End with a concise summary that reinforces key points "
                        + "9. Include a mini-glossary of 3-5 essential terms "

                        + "Use proper markdown formatting with headings (##, ###), bullet points, numbered lists, *emphasis*, "
                        + "**strong emphasis**, `code blocks` when applicable, and > blockquotes for important points.",
                conceptTitle, moduleTitle
        );

        String mainContent = callGeminiApi(mainContentPrompt);

        // 2) Generate transcript for video content
        logger.info("Generating video transcript for concept: {}", conceptTitle);
        String transcriptPrompt = String.format(
                "Create a transcript for a 3-5 minute educational video about '%s'. "

                        + "The transcript should follow this educational narrative structure: "
                        + "1. Start with an attention-grabbing hook or question (10-15 seconds) "
                        + "2. Introduce yourself and the learning objectives (20-30 seconds) "
                        + "3. Provide a brief overview using a relatable analogy (30 seconds) "
                        + "4. Explain core concepts clearly with pauses for emphasis (1-2 minutes) "
                        + "5. Walk through a visual example, describing what viewers would see (1 minute) "
                        + "6. Address a common misconception or challenge (30 seconds) "
                        + "7. Summarize key points with clear takeaways (30 seconds) "
                        + "8. End with a call to action and preview of related topics (15-20 seconds) "

                        + "Use a conversational, engaging tone suitable for narration. Include natural transitions "
                        + "between sections and occasional rhetorical questions to maintain engagement. "
                        + "Format the transcript with speaker cues and [Action] descriptions for visual elements.",
                conceptTitle
        );
        String transcript = callGeminiApi(transcriptPrompt);

        // 3) Generate submodules
        List<SubModuleDto> subModules = generateSubModules(conceptTitle, moduleTitle);

        // 4) Generate quizzes
        List<QuizDto> quizzes = generateQuizzes(conceptTitle, moduleTitle);

        // 5) Find relevant YouTube video
        String youTubeVideoUrl = findRelevantYouTubeVideo(conceptTitle);

        // 6) Build the final learning resource
        LearningResourceDto result = LearningResourceDto.builder()
                .conceptTitle(conceptTitle)
                .moduleTitle(moduleTitle)
                .content(mainContent)
                .transcript(transcript)
                // If you want to keep the old placeholder, you could do something like:
                // .videoUrl( youTubeVideoUrl != null ? youTubeVideoUrl :
                //      "http://example.com/videos/" + conceptTitle.replaceAll("\\s+", "-").toLowerCase())
                .videoUrl(youTubeVideoUrl)
                .subModules(subModules)
                .quizzes(quizzes)
                .build();

        logger.info("Successfully generated learning resource for concept: {}", conceptTitle);
        return result;
    }

    // ================================
    //  YOUTUBE DATA API INTEGRATION
    // ================================
    /**
     * Finds the most relevant YouTube video for the given topic (conceptTitle).
     * This uses the YouTube Data API v3 Search endpoint, requesting 1 result.
     *
     * @param topic The topic or concept to search for
     * @return A YouTube watch URL if found, or null if no video found
     */
    private String findRelevantYouTubeVideo(String topic) {
        try {
            // Construct the search query; you could refine or add "tutorial" etc. if you want
            String query = URLEncoder.encode(topic, StandardCharsets.UTF_8);
            // Build the final URL
            String url = String.format(
                    "%s?part=snippet&maxResults=1&type=video&key=%s&q=%s",
                    YOUTUBE_SEARCH_URL,
                    YOUTUBE_API_KEY,
                    query
            );

            // For convenience, create a local WebClient to talk to YouTube
            WebClient localClient = WebClient.create();

            String rawResponse = localClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (rawResponse == null) {
                logger.warn("YouTube API returned null response for topic: {}", topic);
                return null;
            }

            // Parse JSON to get videoId
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode items = root.path("items");
            if (items.isArray() && items.size() > 0) {
                JsonNode firstItem = items.get(0);
                JsonNode idNode = firstItem.path("id");
                String videoId = idNode.path("videoId").asText();
                if (StringUtils.hasText(videoId)) {
                    return "https://www.youtube.com/watch?v=" + videoId;
                }
            }

            logger.warn("No video results found for topic: {}", topic);
            return null;

        } catch (Exception e) {
            logger.error("Error calling YouTube Data API: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Generates a comprehensive learning resource based on the user's request by sending enhanced
     * educational prompts to Gemini.
     *
     * @param request LearningResourceRequestDto containing conceptTitle, moduleTitle, etc.
     * @return a LearningResourceDto with main content, submodules, quizzes, and transcript
     */
//    public LearningResourceDto generateLearningResource(LearningResourceRequestDto request) {
//        String conceptTitle = request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle();
//        String moduleTitle = request.getModuleTitle();
//
//        logger.info("Starting learning resource generation for concept: {}, module: {}", conceptTitle, moduleTitle);
//
//        // Generate main content with Gemini using an enhanced educational prompt
//        String mainContentPrompt = String.format(
//                "Create a comprehensive learning resource about '%s' in markdown format for module '%s'. " +
//                        "The content should be approximately 400-500 words or about 5-7 minutes of reading time. " +
//
//                        "Follow this educational structure: " +
//                        "1. Start with clear learning objectives that state exactly what the reader will learn " +
//                        "2. Write an engaging introduction that provides context and explains why this topic matters " +
//                        "3. Include conceptual definitions for all key terms to build a solid foundation " +
//                        "4. Break down complex ideas with detailed step-by-step explanations " +
//                        "5. Illustrate with at least 2 real-world examples or case studies " +
//                        "6. Describe visual aids that would enhance understanding (in markdown, describe what the image would show) " +
//                        "7. Add 2-3 reflective questions that encourage readers to apply the concepts " +
//                        "8. End with a concise summary that reinforces key points " +
//                        "9. Include a mini-glossary of 3-5 essential terms " +
//
//                        "Use proper markdown formatting with headings (##, ###), bullet points, numbered lists, *emphasis*, " +
//                        "**strong emphasis**, `code blocks` when applicable, and > blockquotes for important points.",
//                conceptTitle, moduleTitle
//        );
//
//        if (logger.isDebugEnabled()) {
//            logger.debug("Main content prompt (truncated if long): {}",
//                    mainContentPrompt.length() > 500 ? mainContentPrompt.substring(0, 500) + "... [truncated]" : mainContentPrompt);
//        }
//
//        String mainContent = callGeminiApi(mainContentPrompt);
//
//        // Generate transcript for video content
//        logger.info("Generating video transcript for concept: {}", conceptTitle);
//        String transcriptPrompt = String.format(
//                "Create a transcript for a 3-5 minute educational video about '%s'. " +
//
//                        "The transcript should follow this educational narrative structure: " +
//                        "1. Start with an attention-grabbing hook or question (10-15 seconds) " +
//                        "2. Introduce yourself and the learning objectives (20-30 seconds) " +
//                        "3. Provide a brief overview using a relatable analogy (30 seconds) " +
//                        "4. Explain core concepts clearly with pauses for emphasis (1-2 minutes) " +
//                        "5. Walk through a visual example, describing what viewers would see (1 minute) " +
//                        "6. Address a common misconception or challenge (30 seconds) " +
//                        "7. Summarize key points with clear takeaways (30 seconds) " +
//                        "8. End with a call to action and preview of related topics (15-20 seconds) " +
//
//                        "Use a conversational, engaging tone suitable for narration. Include natural transitions " +
//                        "between sections and occasional rhetorical questions to maintain engagement. " +
//                        "Format the transcript with speaker cues and [Action] descriptions for visual elements.",
//                conceptTitle
//        );
//
//        String transcript = callGeminiApi(transcriptPrompt);
//
//        // Generate submodules with appropriate article length
//        List<SubModuleDto> subModules = generateSubModules(conceptTitle, moduleTitle);
//
//        // Generate quizzes for the learning module
//        List<QuizDto> quizzes = generateQuizzes(conceptTitle, moduleTitle);
//
//        LearningResourceDto result = LearningResourceDto.builder()
//                .conceptTitle(conceptTitle)
//                .moduleTitle(moduleTitle)
//                .content(mainContent)
//                .transcript(transcript)
//                .videoUrl("http://example.com/videos/" + conceptTitle.replaceAll("\\s+", "-").toLowerCase())
//                .subModules(subModules)
//                .quizzes(quizzes)
//                .build();
//
//        logger.info("Successfully generated learning resource for concept: {}", conceptTitle);
//        return result;
//    }

    /**
     * Generates submodules for the learning resource with introduction, advanced, and practical implementation sections.
     *
     * @param conceptTitle The concept or topic title
     * @param moduleTitle The module title
     * @return List of SubModuleDto objects
     */
    private List<SubModuleDto> generateSubModules(String conceptTitle, String moduleTitle) {
        List<SubModuleDto> subModules = new ArrayList<>();

        logger.info("Generating introduction submodule for concept: {}", conceptTitle);
        // Introduction submodule with enhanced educational structure
        String introPrompt = String.format(
                "Create an introductory article about '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the article following these educational best practices: " +
                        "1. Begin with 3-4 specific learning objectives in a bulleted list (what readers will learn) " +
                        "2. Write an engaging introduction that hooks the reader with a relevant analogy or question " +
                        "3. Define all fundamental concepts in a clear, accessible way " +
                        "4. Use a step-by-step approach for explaining basics with numbered lists " +
                        "5. Include 1-2 beginner-friendly examples that illustrate the concepts " +
                        "6. Suggest a simple visualization that would help beginners understand (describe what an image would show) " +
                        "7. Add 2 reflection questions that check basic understanding " +
                        "8. Include a 'Key Takeaways' section that summarizes essential points " +
                        "9. Close with a brief preview of more advanced topics " +

                        "Ensure all explanations are beginner-friendly and avoid jargon without explanation. " +
                        "Use markdown formatting effectively with ## headings, ### subheadings, **bold** for important terms, " +
                        "and `code examples` if relevant.",
                conceptTitle
        );

        String introArticle = callGeminiApi(introPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Introduction to " + conceptTitle)
                .article(introArticle)
                .tags(Arrays.asList("introduction", "basics", "fundamentals"))
                .keywords(Arrays.asList("concept", "introduction", "basics", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        logger.info("Generating advanced submodule for concept: {}", conceptTitle);
        // Advanced submodule with enhanced educational structure
        String advancedPrompt = String.format(
                "Create an advanced article about '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the article following these educational best practices: " +
                        "1. Start with 3-4 advanced learning objectives that build on foundational knowledge " +
                        "2. Begin with a brief recap connecting basic concepts to advanced applications " +
                        "3. Explain complex concepts with precise definitions and terminology " +
                        "4. Present at least one detailed case study or complex real-world example " +
                        "5. Discuss common challenges, pitfalls, or misconceptions at this advanced level " +
                        "6. Describe a comparative diagram or visualization that would illustrate advanced concepts " +
                        "7. Include a troubleshooting section that addresses common advanced problems " +
                        "8. Add 2-3 challenging reflection questions that require applying advanced concepts " +
                        "9. Conclude with emerging trends or future directions in this field " +
                        "10. Include a small reference section with theoretical resources for deeper exploration " +

                        "Use appropriate technical language but explain specialized terms. " +
                        "Format with markdown using ## for main sections, ### for subsections, **bold** for key concepts, " +
                        "`code blocks` for technical examples, and > blockquotes for expert insights.",
                conceptTitle
        );

        String advancedArticle = callGeminiApi(advancedPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Advanced " + conceptTitle)
                .article(advancedArticle)
                .tags(Arrays.asList("advanced", "in-depth", "applications"))
                .keywords(Arrays.asList("advanced", "detailed", "expert", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        logger.info("Generating practical implementation submodule for concept: {}", conceptTitle);
        // Practical implementation submodule with enhanced educational structure
        String practicalPrompt = String.format(
                "Create a practical implementation guide for '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the guide following these educational best practices: " +
                        "1. Begin with 3-4 practical skill-based learning objectives " +
                        "2. List any prerequisites or required background knowledge " +
                        "3. Provide an overview of the implementation process with a numbered workflow " +
                        "4. Break down the implementation into clear, sequential steps " +
                        "5. Include practical code samples, commands, or specific instructions where relevant " +
                        "6. Highlight common errors or pitfalls and how to avoid them " +
                        "7. Suggest a workflow diagram that would illustrate the implementation process " +
                        "8. Provide debugging tips or troubleshooting guidance " +
                        "9. Add 2-3 hands-on exercises or challenges for practice " +
                        "10. Include a checklist for verifying successful implementation " +
                        "11. End with next steps for extending or customizing the implementation " +

                        "Use clear, action-oriented language with specific examples. " +
                        "Format with markdown using ## for main sections, ### for steps, **bold** for important warnings, " +
                        "```code blocks``` for implementation examples, and * bullet points for tips and alternatives.",
                conceptTitle
        );

        String practicalArticle = callGeminiApi(practicalPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Practical Implementation of " + conceptTitle)
                .article(practicalArticle)
                .tags(Arrays.asList("practical", "implementation", "hands-on"))
                .keywords(Arrays.asList("implementation", "practice", "tutorial", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        return subModules;
    }

    /**
     * Generates quizzes for the learning resource to test comprehension and knowledge retention.
     * Creates multiple quiz types: basic understanding, advanced concepts, and practical application.
     *
     * @param conceptTitle The concept or topic title
     * @param moduleTitle The module title
     * @return List of QuizDto objects
     */
    private List<QuizDto> generateQuizzes(String conceptTitle, String moduleTitle) {
        List<QuizDto> quizzes = new ArrayList<>();

        logger.info("Generating quizzes for concept: {}", conceptTitle);

        // Basic concepts quiz
        String basicQuizPrompt = String.format(
                "Create a quiz to test basic understanding of '%s' with 5 multiple-choice questions. " +
                        "For each question: " +
                        "1. Write a clear question focused on fundamental concepts " +
                        "2. Provide 4 answer options (A, B, C, D) " +
                        "3. Indicate the correct answer " +
                        "4. Include a brief explanation for why the answer is correct " +
                        "5. Ensure questions progress from simple recall to basic application " +

                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"What is...?\", " +
                        "      \"options\": [\"A. option 1\", \"B. option 2\", \"C. option 3\", \"D. option 4\"], " +
                        "      \"correctAnswer\": \"B\", " +
                        "      \"explanation\": \"Explanation why B is correct...\" " +
                        "    } " +
                        "  ] " +
                        "} " +

                        "Focus on essential terminology and foundational principles that every beginner should master.",
                conceptTitle
        );

        String basicQuizJson = callGeminiApi(basicQuizPrompt);
        List<QuestionDto> basicQuestions = parseQuizQuestions(basicQuizJson);

        quizzes.add(QuizDto.builder()
                .quizTitle("Basic Concepts: " + conceptTitle)
                .description("Test your understanding of the fundamental concepts of " + conceptTitle)
                .difficulty("Beginner")
                .timeLimit("5 minutes")
                .questions(basicQuestions)
                .passingScore(60)
                .build());

        // Advanced concepts quiz
        String advancedQuizPrompt = String.format(
                "Create a quiz to test advanced understanding of '%s' with 5 challenging multiple-choice questions. " +
                        "For each question: " +
                        "1. Write a question that tests deeper understanding or application of complex concepts " +
                        "2. Provide 4 answer options (A, B, C, D) with plausible distractors " +
                        "3. Indicate the correct answer " +
                        "4. Include a detailed explanation that clarifies misconceptions " +
                        "5. Ensure questions require analysis, evaluation, or synthesis of knowledge " +

                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"In a complex scenario where...?\", " +
                        "      \"options\": [\"A. option 1\", \"B. option 2\", \"C. option 3\", \"D. option 4\"], " +
                        "      \"correctAnswer\": \"C\", " +
                        "      \"explanation\": \"C is correct because...\" " +
                        "    } " +
                        "  ] " +
                        "} " +

                        "Focus on nuanced understanding, common misconceptions, and practical applications of advanced principles.",
                conceptTitle
        );

        String advancedQuizJson = callGeminiApi(advancedQuizPrompt);
        List<QuestionDto> advancedQuestions = parseQuizQuestions(advancedQuizJson);

        quizzes.add(QuizDto.builder()
                .quizTitle("Advanced Concepts: " + conceptTitle)
                .description("Challenge yourself with these advanced questions about " + conceptTitle)
                .difficulty("Advanced")
                .timeLimit("10 minutes")
                .questions(advancedQuestions)
                .passingScore(70)
                .build());

        // Practical application quiz
        String practicalQuizPrompt = String.format(
                "Create a quiz to test practical application of '%s' with 5 scenario-based multiple-choice questions. " +
                        "For each question: " +
                        "1. Present a realistic scenario or problem that requires applying knowledge " +
                        "2. Provide 4 answer options (A, B, C, D) that represent different approaches or solutions " +
                        "3. Indicate the correct answer " +
                        "4. Include an explanation that justifies the best approach and addresses why others are less optimal " +
                        "5. Ensure questions mirror real-world implementation challenges " +

                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"In a project where...\", " +
                        "      \"options\": [\"A. approach 1\", \"B. approach 2\", \"C. approach 3\", \"D. approach 4\"], " +
                        "      \"correctAnswer\": \"A\", " +
                        "      \"explanation\": \"A is the best approach because...\" " +
                        "    } " +
                        "  ] " +
                        "} " +

                        "Focus on practical problem-solving, implementation decisions, and best practices in real-world contexts.",
                conceptTitle
        );

        String practicalQuizJson = callGeminiApi(practicalQuizPrompt);
        List<QuestionDto> practicalQuestions = parseQuizQuestions(practicalQuizJson);

        quizzes.add(QuizDto.builder()
                .quizTitle("Practical Application: " + conceptTitle)
                .description("Apply your knowledge of " + conceptTitle + " to solve real-world scenarios")
                .difficulty("Intermediate")
                .timeLimit("15 minutes")
                .questions(practicalQuestions)
                .passingScore(80)
                .build());

        return quizzes;
    }

    /**
     * Parse the JSON response from quiz generation to extract questions
     *
     * @param quizJson JSON string containing quiz questions
     * @return List of QuestionDto objects
     */
    /**
     * Parse the JSON response from quiz generation to extract questions with enhanced error handling
     *
     * @param quizJson JSON string containing quiz questions
     * @return List of QuestionDto objects
     */
    private List<QuestionDto> parseQuizQuestions(String quizJson) {
        List<QuestionDto> questions = new ArrayList<>();

        try {
            // Remove markdown code fences and extraneous tokens like "json"
            quizJson = quizJson.replaceAll("```(json)?", "")
                    .replaceAll("```", "")
                    .replaceAll("^\\s*json\\s*", "")  // Remove leading "json" token if present
                    .replaceAll("^.*?\\{", "{")         // Remove any leading text before the first '{'
                    .replaceAll("\\}.*$", "}")          // Remove any trailing text after the last '}'
                    .trim();

            // Attempt to parse the cleaned JSON
            JsonNode root = objectMapper.readTree(quizJson);
            JsonNode questionsNode = root.path("questions");

            if (questionsNode.isArray()) {
                for (JsonNode questionNode : questionsNode) {
                    String questionText = extractStringValue(questionNode, "question");
                    List<String> options = extractOptions(questionNode);
                    String correctAnswer = extractStringValue(questionNode, "correctAnswer");
                    String explanation = extractStringValue(questionNode, "explanation");

                    // Only add if we have meaningful data
                    if (StringUtils.hasText(questionText) && !options.isEmpty()) {
                        questions.add(QuestionDto.builder()
                                .question(questionText)
                                .options(options)
                                .correctAnswer(correctAnswer)
                                .explanation(explanation)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Comprehensive error parsing quiz JSON: {}", e.getMessage(), e);
        }

        // Fallback to default question if no questions parsed
        if (questions.isEmpty()) {
            logger.warn("Failed to parse quiz questions from JSON. Creating default question.");
            questions.add(createDefaultQuestion());
        }

        return questions;
    }


    /**
     * Safely extract string value from JSON node
     */
    private String extractStringValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);
        return fieldNode.isTextual() ? fieldNode.asText() : "";
    }

    /**
     * Safely extract options from JSON node
     */
    private List<String> extractOptions(JsonNode questionNode) {
        List<String> options = new ArrayList<>();
        JsonNode optionsNode = questionNode.path("options");

        if (optionsNode.isArray()) {
            for (JsonNode optionNode : optionsNode) {
                if (optionNode.isTextual()) {
                    options.add(optionNode.asText());
                }
            }
        }

        return options;
    }

    /**
     * Create a default question when parsing fails
     */
    private QuestionDto createDefaultQuestion() {
        return QuestionDto.builder()
                .question("What is the main focus of this topic?")
                .options(Arrays.asList(
                        "A. Option 1",
                        "B. Option 2",
                        "C. Option 3",
                        "D. Option 4"))
                .correctAnswer("A")
                .explanation("Default question due to parsing error.")
                .build();
    }

    /**
     * Calls the Gemini API with the given prompt and extracts the generated text from the response.
     *
     * @param prompt The detailed prompt for content generation
     * @return The text content generated by Gemini
     */
    private String callGeminiApi(String prompt) {
        // Construct the payload for Gemini API
        String payload = String.format("""
            {
                "contents": [{
                    "parts": [{
                        "text": "%s"
                    }]
                }]
            }
            """, prompt.replace("\"", "\\\""));

        try {
            // Call Gemini API
            String rawResponse = geminiWebClient.post()
                    .uri("") // URL is already set in the WebClient bean
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {}", rawResponse);
            }

            // Parse the response to extract the content
            JsonNode root = objectMapper.readTree(rawResponse);
            // Typically, the structure is "candidates" -> [0] -> "content" -> "parts" -> [0] -> "text"
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String generatedText = textNode.asText();

            if (generatedText == null || generatedText.trim().isEmpty()) {
                logger.warn("Gemini API returned empty text content");
                return "Content generation failed. Please try again.";
            }

            // Clean up triple backticks if the LLM included them
            generatedText = generatedText.replaceAll("```markdown", "")
                    .replaceAll("```", "")
                    .trim();

            return generatedText;

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate content from Gemini API", e);
        }
    }
}