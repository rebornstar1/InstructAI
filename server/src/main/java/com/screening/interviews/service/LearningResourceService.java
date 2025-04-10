package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.model.Module;
import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.SubModuleDto;
import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.dto.QuestionDto;
import com.screening.interviews.model.Quiz;
import com.screening.interviews.model.QuizQuestion;
import com.screening.interviews.model.SubModule;
import com.screening.interviews.repo.ModuleRepository;
import com.screening.interviews.repo.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import com.screening.interviews.repo.SubModuleRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private static final Logger logger = LoggerFactory.getLogger(LearningResourceService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final SubModuleRepository subModuleRepository;
    private final ModuleRepository moduleRepository;
    private final QuizRepository quizRepository;
    private final ProgressService userModuleProgressService;

    private static final String YOUTUBE_API_KEY = "AIzaSyCItvhHeCz5v3eQRp3SziAvHk-2XUUKg1Q";
    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    public LearningResourceDto generateLearningResource(LearningResourceRequestDto request) {
        String conceptTitle = request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle();
        String moduleTitle = request.getModuleTitle();
        Long moduleId = request.getModuleId();

        logger.info("Starting learning resource generation for concept: {}, module: {}", conceptTitle, moduleTitle);

        // 1) Generate main content using Gemini
        String mainContent = generateMainContent(conceptTitle, moduleTitle);

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found with id: " + moduleId));
        module.setContent(mainContent);
        moduleRepository.save(module);

        // 2) Generate transcript for video content
        logger.info("Generating video transcript for concept: {}", conceptTitle);
        String transcript = generateTranscript(conceptTitle);

        // 3) Analyze the topic complexity and identify key terms for submodules
        Map<String, String> keyTerms = analyzeTopicAndExtractKeyTerms(conceptTitle, moduleTitle);

        // 4) Generate dynamic submodules based on complexity analysis
        List<SubModuleDto> subModuleDtos = generateDynamicSubModules(conceptTitle, moduleTitle, keyTerms, moduleId);

        // 5) Persist submodules to database
        List<SubModuleDto> persistedSubModules = persistSubModules(subModuleDtos, moduleId);

        // 6) Generate quizzes
        List<QuizDto> quizzes = generateQuizzes(conceptTitle, moduleTitle);
        List<QuizDto> persistedQuizzes = persistQuizzes(quizzes, moduleId);

        // 7) Find relevant YouTube videos for main concept and key terms
        Map<String, List<String>> allVideos = new HashMap<>();
        List<String> mainConceptVideos = findRelevantYouTubeVideos(conceptTitle, 3);

        module.setVideoUrls(mainConceptVideos);
        moduleRepository.save(module);

        allVideos.put(conceptTitle, mainConceptVideos);

        // Find definition videos for each key term
        keyTerms.forEach((term, definition) -> {
            List<String> termVideos = findDefinitionVideos(term);
            if (!termVideos.isEmpty()) {
                allVideos.put(term, termVideos);
            }
        });

        // 8) Build the final learning resource DTO
        LearningResourceDto result = LearningResourceDto.builder()
                .conceptTitle(conceptTitle)
                .moduleTitle(moduleTitle)
                .content(mainContent)
                .transcript(transcript)
                .videoUrls(mainConceptVideos)
                .subModules(persistedSubModules)
                .quizzes(persistedQuizzes)
                .build();

        userModuleProgressService.updateTotalSubmodules(moduleId);

        logger.info("Successfully generated learning resource for concept: {}", conceptTitle);
        return result;
    }

    private String generateMainContent(String conceptTitle, String moduleTitle) {
        logger.info("Generating main content for concept: {}", conceptTitle);
        String mainContentPrompt = String.format(
                "Create a comprehensive learning resource about '%s' in markdown format for module '%s'. " +
                        "The content should be approximately 400-500 words or about 5-7 minutes of reading time. " +
                        "Follow this educational structure: " +
                        "1. Start with clear learning objectives that state exactly what the reader will learn " +
                        "2. Write an engaging introduction that provides context and explains why this topic matters " +
                        "3. Include conceptual definitions for all key terms to build a solid foundation " +
                        "4. Break down complex ideas with detailed step-by-step explanations " +
                        "5. Illustrate with at least 2 real-world examples or case studies " +
                        "6. Describe visual aids that would enhance understanding (in markdown, describe what the image would show) " +
                        "7. Add 2-3 reflective questions that encourage readers to apply the concepts " +
                        "8. End with a concise summary that reinforces key points " +
                        "9. Include a mini-glossary of 3-5 essential terms " +
                        "Use proper markdown formatting with headings (##, ###), bullet points, numbered lists, *emphasis*, " +
                        "**strong emphasis**, `code blocks` when applicable, and > blockquotes for important points.",
                conceptTitle, moduleTitle
        );
        return callGeminiApi(mainContentPrompt);
    }

    private String generateTranscript(String conceptTitle) {
        String transcriptPrompt = String.format(
                "Create a transcript for a 3-5 minute educational video about '%s'. " +
                        "The transcript should follow this educational narrative structure: " +
                        "1. Start with an attention-grabbing hook or question (10-15 seconds) " +
                        "2. Introduce yourself and the learning objectives (20-30 seconds) " +
                        "3. Provide a brief overview using a relatable analogy (30 seconds) " +
                        "4. Explain core concepts clearly with pauses for emphasis (1-2 minutes) " +
                        "5. Walk through a visual example, describing what viewers would see (1 minute) " +
                        "6. Address a common misconception or challenge (30 seconds) " +
                        "7. Summarize key points with clear takeaways (30 seconds) " +
                        "8. End with a call to action and preview of related topics (15-20 seconds) " +
                        "Use a conversational, engaging tone suitable for narration. Include natural transitions " +
                        "between sections and occasional rhetorical questions to maintain engagement. " +
                        "Format the transcript with speaker cues and [Action] descriptions for visual elements.",
                conceptTitle
        );
        return callGeminiApi(transcriptPrompt);
    }

    private Map<String, String> analyzeTopicAndExtractKeyTerms(String conceptTitle, String moduleTitle) {
        logger.info("Analyzing topic complexity and extracting key terms for: {}", conceptTitle);

        String analysisPrompt = String.format(
                "Analyze the topic '%s' in the context of module '%s' and identify 5-10 key terms or concepts " +
                        "that would benefit from detailed explanation. For each term, provide a short 1-2 sentence definition. " +
                        "Format your response as a JSON object with the term as key and definition as value: " +
                        "{ " +
                        "  \"term1\": \"definition1\", " +
                        "  \"term2\": \"definition2\" " +
                        "} " +
                        "Focus on identifying terms that are: " +
                        "1. Foundational to understanding the topic " +
                        "2. Potentially unfamiliar to beginners " +
                        "3. Technical or domain-specific " +
                        "4. Frequently referenced when discussing this topic " +
                        "5. Important for practical implementation",
                conceptTitle, moduleTitle
        );

        String analysisResult = callGeminiApi(analysisPrompt);

        // Parse the JSON response to extract key terms and definitions
        Map<String, String> keyTerms = new HashMap<>();
        try {
            // More robust cleanup of the response to ensure it's valid JSON
            // First, remove any markdown code block indicators
            analysisResult = analysisResult.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Find the first '{' and the last '}' to extract just the JSON object
            int firstBrace = analysisResult.indexOf('{');
            int lastBrace = analysisResult.lastIndexOf('}');

            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                // Extract only the JSON part
                analysisResult = analysisResult.substring(firstBrace, lastBrace + 1);

                // Parse the JSON
                JsonNode termsNode = objectMapper.readTree(analysisResult);

                termsNode.fields().forEachRemaining(entry -> {
                    keyTerms.put(entry.getKey(), entry.getValue().asText());
                });

                logger.info("Extracted {} key terms for topic: {}", keyTerms.size(), conceptTitle);
            } else {
                throw new Exception("Could not find valid JSON object in response");
            }
        } catch (Exception e) {
            logger.error("Error parsing key terms JSON: {}", e.getMessage());
            // Log the actual response for debugging
            logger.debug("Raw response from Gemini API: {}", analysisResult);

            // Provide some default terms if parsing fails
            keyTerms.put(conceptTitle + " basics", "Fundamental concepts of " + conceptTitle);
            keyTerms.put(conceptTitle + " implementation", "How to implement " + conceptTitle + " in practice");
        }

        return keyTerms;
    }

    private List<SubModuleDto> generateDynamicSubModules(String conceptTitle, String moduleTitle,
                                                         Map<String, String> keyTerms, Long moduleId) {
        List<SubModuleDto> subModules = new ArrayList<>();

        // 1. Always create an introduction submodule
        logger.info("Generating introduction submodule for concept: {}", conceptTitle);
        SubModuleDto introModule = createIntroductionSubModule(conceptTitle);
        subModules.add(introModule);

        // 2. Generate term-specific submodules based on the key terms
        for (Map.Entry<String, String> entry : keyTerms.entrySet()) {
            String term = entry.getKey();
            String definition = entry.getValue();

            logger.info("Generating submodule for key term: {}", term);
            SubModuleDto termModule = createTermSubModule(term, definition, conceptTitle);
            subModules.add(termModule);
        }

        // 3. Add an advanced application module
        logger.info("Generating advanced application submodule for concept: {}", conceptTitle);
        SubModuleDto advancedModule = createAdvancedApplicationSubModule(conceptTitle, keyTerms);
        subModules.add(advancedModule);

        return subModules;
    }

    private SubModuleDto createIntroductionSubModule(String conceptTitle) {
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

        return SubModuleDto.builder()
                .subModuleTitle("Introduction to " + conceptTitle)
                .article(introArticle)
                .tags(Arrays.asList("introduction", "basics", "fundamentals"))
                .keywords(Arrays.asList("concept", "introduction", "basics", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build();
    }

    private SubModuleDto createTermSubModule(String term, String definition, String conceptTitle) {
        String termPrompt = String.format(
                "Create a focused educational article about '%s' in the context of %s. " +
                        "The article should be approximately 300-400 words or 3-4 minutes reading time. " +
                        "Begin with this definition as your starting point: '%s' " +
                        "Then structure the article as follows: " +
                        "1. Expand on the definition with more detail and context " +
                        "2. Explain why this term/concept is important in understanding %s " +
                        "3. Provide at least one clear, concrete example of this term/concept in action " +
                        "4. Describe how this term/concept relates to other key ideas in %s " +
                        "5. Include a simple diagram or visual description that would help illustrate this concept " +
                        "6. Add 1-2 practice exercises or reflection questions related to this term " +
                        "Use clear, accessible language and markdown formatting with appropriate headings, " +
                        "emphasis, and code blocks if relevant.",
                term, conceptTitle, definition, conceptTitle, conceptTitle
        );

        String termArticle = callGeminiApi(termPrompt);

        return SubModuleDto.builder()
                .subModuleTitle(term)
                .article(termArticle)
                .tags(Arrays.asList("definition", "concept", "terminology"))
                .keywords(Arrays.asList(term.toLowerCase(), conceptTitle.toLowerCase(), "definition"))
                .readingTime("4 minutes")
                .build();
    }

    private SubModuleDto createAdvancedApplicationSubModule(String conceptTitle, Map<String, String> keyTerms) {
        // Join key terms for context
        String termsList = String.join(", ", keyTerms.keySet());

        String advancedPrompt = String.format(
                "Create an advanced application article about '%s' that integrates these key terms: %s. " +
                        "The article should be approximately 500-600 words or 6 minutes reading time. " +
                        "Structure the article following these educational best practices: " +
                        "1. Begin with 3-4 advanced learning objectives that build on foundational knowledge " +
                        "2. Present a complex, real-world scenario where %s is applied " +
                        "3. Walk through a step-by-step solution that demonstrates how to apply multiple concepts together " +
                        "4. Highlight how the key terms/concepts interact with each other in this scenario " +
                        "5. Discuss common pitfalls or challenges in advanced applications " +
                        "6. Provide troubleshooting tips or best practices " +
                        "7. Include a section on emerging trends or future developments " +
                        "8. Add 2-3 advanced practice exercises that require integrating multiple concepts " +
                        "Use appropriate technical language with explanations where needed. " +
                        "Format with markdown using proper headings, code blocks for technical examples, " +
                        "and emphasized text for important points.",
                conceptTitle, termsList, conceptTitle
        );

        String advancedArticle = callGeminiApi(advancedPrompt);

        return SubModuleDto.builder()
                .subModuleTitle("Advanced Applications of " + conceptTitle)
                .article(advancedArticle)
                .tags(Arrays.asList("advanced", "applications", "integration", "case-study"))
                .keywords(Arrays.asList("advanced", "application", "implementation", conceptTitle.toLowerCase()))
                .readingTime("6 minutes")
                .build();
    }

    private List<SubModuleDto> persistSubModules(List<SubModuleDto> subModuleDtos, Long moduleId) {
        List<SubModuleDto> persistedSubModules = new ArrayList<>();
        for (SubModuleDto dto : subModuleDtos) {
            dto.setModuleId(moduleId);
            SubModule entity = convertToSubModule(dto);
            SubModule savedEntity = subModuleRepository.save(entity);
            persistedSubModules.add(convertToSubModuleDto(savedEntity));
        }
        return persistedSubModules;
    }

    private List<QuizDto> persistQuizzes(List<QuizDto> quizzes, Long moduleId) {
        List<QuizDto> persistedQuizzes = new ArrayList<>();
        for (QuizDto dto : quizzes) {
            Quiz quizEntity = convertToQuiz(dto, moduleId);
            Quiz savedQuiz = quizRepository.save(quizEntity);
            persistedQuizzes.add(convertToQuizDto(savedQuiz));
        }
        return persistedQuizzes;
    }

    private List<String> findDefinitionVideos(String term) {
        logger.info("Searching for definition videos for term: {}", term);
        // Search for definition-style videos for key terms
        String searchQuery = term + " definition explained";
        return findRelevantYouTubeVideos(searchQuery, 2);
    }

    private List<String> findRelevantYouTubeVideos(String topic, int maxResults) {
        List<String> videoUrls = new ArrayList<>();
        try {
            String searchQuery = URLEncoder.encode(topic, StandardCharsets.UTF_8);
            String url = String.format(
                    "%s?part=snippet&maxResults=%d&type=video&key=%s&q=%s",
                    YOUTUBE_SEARCH_URL,
                    maxResults,
                    YOUTUBE_API_KEY,
                    searchQuery
            );

            WebClient localClient = WebClient.create();
            String rawResponse = localClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (rawResponse == null) {
                logger.warn("YouTube API returned null response for searchQuery: {}", searchQuery);
                return videoUrls;
            }

            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode items = root.path("items");

            if (items.isArray()) {
                for (JsonNode item : items) {
                    JsonNode idNode = item.path("id");
                    String videoId = idNode.path("videoId").asText();
                    if (StringUtils.hasText(videoId)) {
                        videoUrls.add("https://www.youtube.com/watch?v=" + videoId);
                    }
                }
            }

            if (videoUrls.isEmpty()) {
                logger.warn("No video results found for topic: {}", topic);
            }
        } catch (Exception e) {
            logger.error("Error calling YouTube Data API: {}", e.getMessage(), e);
        }
        return videoUrls;
    }

    private Quiz convertToQuiz(QuizDto dto, Long moduleId) {
        Quiz quiz = new Quiz();
        quiz.setQuizTitle(dto.getQuizTitle());
        quiz.setDescription(dto.getDescription());
        quiz.setDifficulty(dto.getDifficulty());
        quiz.setTimeLimit(dto.getTimeLimit());
        quiz.setPassingScore(dto.getPassingScore());

        if (moduleId != null) {
            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new RuntimeException("Module not found with ID: " + moduleId));
            quiz.setModule(module);
        }

        // Convert questions
        if (dto.getQuestions() != null) {
            List<QuizQuestion> questions = dto.getQuestions().stream().map(qdto -> {
                QuizQuestion question = new QuizQuestion();
                question.setQuestion(qdto.getQuestion());
                question.setOptions(qdto.getOptions());
                question.setCorrectAnswer(qdto.getCorrectAnswer());
                question.setExplanation(qdto.getExplanation());
                question.setQuiz(quiz);
                return question;
            }).collect(Collectors.toList());
            quiz.setQuestions(questions);
        }
        return quiz;
    }

    private QuizDto convertToQuizDto(Quiz quiz) {
        List<QuestionDto> questionDtos = quiz.getQuestions() != null ? quiz.getQuestions().stream().map(q ->
                QuestionDto.builder()
                        .question(q.getQuestion())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .explanation(q.getExplanation())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return QuizDto.builder()
                .quizTitle(quiz.getQuizTitle())
                .description(quiz.getDescription())
                .difficulty(quiz.getDifficulty())
                .timeLimit(quiz.getTimeLimit())
                .passingScore(quiz.getPassingScore())
                .questions(questionDtos)
                .build();
    }

    private SubModule convertToSubModule(SubModuleDto dto) {
        SubModule subModule = new SubModule();
        subModule.setSubModuleTitle(dto.getSubModuleTitle());
        subModule.setArticle(dto.getArticle());
        subModule.setReadingTime(dto.getReadingTime());
        subModule.setTags(dto.getTags());
        subModule.setKeywords(dto.getKeywords());

        if (dto.getModuleId() != null) {
            Module module = moduleRepository.findById(dto.getModuleId())
                    .orElseThrow(() -> new RuntimeException("Module not found with ID: " + dto.getModuleId()));
            subModule.setModule(module);
        }
        return subModule;
    }

    private SubModuleDto convertToSubModuleDto(SubModule entity) {
        return SubModuleDto.builder()
                .moduleId(entity.getModule() != null ? entity.getModule().getId() : null)
                .subModuleTitle(entity.getSubModuleTitle())
                .article(entity.getArticle())
                .readingTime(entity.getReadingTime())
                .tags(entity.getTags())
                .keywords(entity.getKeywords())
                .build();
    }

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

        return quizzes;
    }


    private QuizDto generateQuiz(String conceptTitle) {
        QuizDto quiz = null;
        logger.info("Generating quiz for concept: {}", conceptTitle);

        // Basic concepts quiz
//        String basicQuizPrompt = String.format(
//                "Create a quiz to test basic understanding of '%s' with 5 multiple-choice questions. " +
//                        "For each question: " +
//                        "1. Write a clear question focused on fundamental concepts " +
//                        "2. Provide 4 answer options (A, B, C, D) " +
//                        "3. Indicate the correct answer " +
//                        "4. Include a brief explanation for why the answer is correct " +
//                        "5. Ensure questions progress from simple recall to basic application " +
//                        "Format as a structured JSON object with these exact fields: " +
//                        "{ " +
//                        "  \"questions\": [ " +
//                        "    { " +
//                        "      \"question\": \"What is...?\", " +
//                        "      \"options\": [\"A. option 1\", \"B. option 2\", \"C. option 3\", \"D. option 4\"], " +
//                        "      \"correctAnswer\": \"B\", " +
//                        "      \"explanation\": \"Explanation why B is correct...\" " +
//                        "    } " +
//                        "  ] " +
//                        "} " +
//                        "Focus on essential terminology and foundational principles that every beginner should master.",
//                conceptTitle
//        );
//
//        String basicQuizJson = callGeminiApi(basicQuizPrompt);
//        List<QuestionDto> basicQuestions = parseQuizQuestions(basicQuizJson);
//
//        quizzes.add(QuizDto.builder()
//                .quizTitle("Basic Concepts: " + conceptTitle)
//                .description("Test your understanding of the fundamental concepts of " + conceptTitle)
//                .difficulty("Beginner")
//                .timeLimit("5 minutes")
//                .questions(basicQuestions)
//                .passingScore(60)
//                .build());

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

        quiz = QuizDto.builder()
                .quizTitle("Advanced Concepts: " + conceptTitle)
                .description("Challenge yourself with these advanced questions about " + conceptTitle)
                .difficulty("Advanced")
                .timeLimit("10 minutes")
                .questions(advancedQuestions)
                .passingScore(70)
                .build();

        return quiz;
    }

    public List<QuizDto> generateMultipleQuiz(List<String> conceptTitles) {
        List<QuizDto> quizzes = new ArrayList<>();
        for (String conceptTitle : conceptTitles) {
            QuizDto quiz = generateQuiz(conceptTitle);
            quizzes.add(quiz);
        }
        return quizzes;
    }



    private List<QuestionDto> parseQuizQuestions(String quizJson) {
        List<QuestionDto> questions = new ArrayList<>();

        try {
            // First, perform a more thorough JSON cleaning
            String cleanedJson = cleanJsonString(quizJson);

            // Attempt to parse the cleaned JSON
            JsonNode root = objectMapper.readTree(cleanedJson);

            // Check if we have a "questions" array at the root
            JsonNode questionsNode = root.has("questions") ? root.get("questions") : root;

            // If it's not an array, try to handle it as a single question or look for another structure
            if (!questionsNode.isArray()) {
                logger.warn("Received quiz JSON that is not an array. Trying to extract questions object.");

                // If the root has fields that look like a single question, treat it as such
                if (root.has("question") || root.has("options")) {
                    QuestionDto question = extractSingleQuestion(root);
                    if (question != null) {
                        questions.add(question);
                    }
                } else {
                    // Last resort: search for any object that might be a question
                    root.fields().forEachRemaining(entry -> {
                        if (entry.getValue().isObject()) {
                            QuestionDto question = extractSingleQuestion(entry.getValue());
                            if (question != null) {
                                questions.add(question);
                            }
                        }
                    });
                }
            } else {
                // Process each question in the array
                for (JsonNode questionNode : questionsNode) {
                    QuestionDto question = extractSingleQuestion(questionNode);
                    if (question != null) {
                        questions.add(question);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Comprehensive error parsing quiz JSON: {}", e.getMessage(), e);
        }

        // Fallback to default questions if no questions parsed
        if (questions.isEmpty()) {
            logger.warn("Failed to parse quiz questions from JSON. Creating default questions.");
            questions.add(createDefaultQuestion());
        }

        return questions;
    }

    /**
     * Clean the JSON string to make it more likely to parse successfully
     */
    private String cleanJsonString(String rawJson) {
        if (rawJson == null || rawJson.trim().isEmpty()) {
            return "{}";
        }

        String cleaned = rawJson;

        // Remove Markdown code block markers
        cleaned = cleaned.replaceAll("```(json)?", "").replaceAll("```", "").trim();

        // Remove any leading text before first opening brace
        cleaned = cleaned.replaceAll("^[^{]*\\{", "{");

        // Remove any trailing text after last closing brace
        cleaned = cleaned.replaceAll("\\}[^}]*$", "}");

        // Fix trailing commas in arrays and objects (common issue from LLMs)
        cleaned = cleaned.replaceAll(",\\s*]", "]");
        cleaned = cleaned.replaceAll(",\\s*}", "}");

        // Fix missing commas between array elements (just after a closing brace or bracket)
        cleaned = cleaned.replaceAll("(\\}|\\])\\s*(\\{)", "$1,$2");
        cleaned = cleaned.replaceAll("(\\}|\\])\\s*(\\[)", "$1,$2");

        // Fix property names without quotes
        cleaned = cleaned.replaceAll("([{,]\\s*)(\\w+)(:)", "$1\"$2\"$3");

        // Make sure array elements have commas between them
        cleaned = cleaned.replaceAll("\"\\s*\\{", "\",{");

        // Ensure enclosing brackets if missing
        if (!cleaned.trim().startsWith("{") && !cleaned.trim().startsWith("[")) {
            // Try to determine if it should be an array or object
            if (cleaned.contains("\"question\"") || cleaned.contains("\"options\"")) {
                cleaned = "{" + cleaned + "}";
            } else {
                cleaned = "[" + cleaned + "]";
            }
        }

        // If we don't have a "questions" wrapper, add it for consistency if it looks like an array of questions
        if (cleaned.trim().startsWith("[") &&
                (cleaned.contains("\"question\"") || cleaned.contains("\"options\""))) {
            cleaned = "{\"questions\":" + cleaned + "}";
        }

        return cleaned;
    }

    /**
     * Extract a single question from a JsonNode
     */
    private QuestionDto extractSingleQuestion(JsonNode questionNode) {
        try {
            String questionText = extractStringValue(questionNode, "question");

            // If question is empty, this node probably isn't a question
            if (questionText == null || questionText.trim().isEmpty()) {
                return null;
            }

            List<String> options = extractOptions(questionNode);
            String correctAnswer = extractStringValue(questionNode, "correctAnswer");

            // Try "correct_answer" if "correctAnswer" is not found
            if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
                correctAnswer = extractStringValue(questionNode, "correct_answer");
            }

            // Also check for possible numeric index as correctAnswerIndex
            if ((correctAnswer == null || correctAnswer.trim().isEmpty()) && questionNode.has("correctAnswerIndex")) {
                JsonNode indexNode = questionNode.get("correctAnswerIndex");
                if (indexNode.isInt() && indexNode.asInt() >= 0 && indexNode.asInt() < options.size()) {
                    int index = indexNode.asInt();
                    // Convert numeric index to A, B, C, D format
                    correctAnswer = String.valueOf((char)('A' + index));
                }
            }

            String explanation = extractStringValue(questionNode, "explanation");

            // Only create the question if we have at least question text and options
            if (!options.isEmpty()) {
                return QuestionDto.builder()
                        .question(questionText)
                        .options(options)
                        .correctAnswer(correctAnswer)
                        .explanation(explanation)
                        .build();
            }
        } catch (Exception e) {
            logger.warn("Error extracting individual question: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Improved extraction of string value with null safety
     */
    private String extractStringValue(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName)) {
            return "";
        }

        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode.isTextual()) {
            return fieldNode.asText();
        } else if (fieldNode.isValueNode()) {
            // Convert numeric or boolean to string
            return fieldNode.asText();
        }

        return "";
    }

    /**
     * Improved extraction of options with better error handling
     */
    private List<String> extractOptions(JsonNode questionNode) {
        List<String> options = new ArrayList<>();

        if (questionNode == null || !questionNode.has("options")) {
            return options;
        }

        JsonNode optionsNode = questionNode.get("options");

        if (optionsNode.isArray()) {
            for (JsonNode optionNode : optionsNode) {
                if (optionNode.isTextual()) {
                    options.add(optionNode.asText());
                } else if (optionNode.isValueNode()) {
                    // Convert other value nodes (numbers, booleans) to strings
                    options.add(optionNode.asText());
                }
            }
        } else if (optionsNode.isTextual()) {
            // Sometimes LLMs might incorrectly format options as a comma-separated string
            String[] optionArray = optionsNode.asText().split(",");
            for (String option : optionArray) {
                options.add(option.trim());
            }
        }

        return options;
    }

    /**
     * Create a default question as a fallback
     */
    private QuestionDto createDefaultQuestion() {
        return QuestionDto.builder()
                .question("What is the main focus of this topic?")
                .options(Arrays.asList(
                        "A. Understanding core concepts",
                        "B. Practical applications",
                        "C. Historical development",
                        "D. Future trends"))
                .correctAnswer("A")
                .explanation("This is a default question created because the system encountered an error while generating custom questions.")
                .build();
    }

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