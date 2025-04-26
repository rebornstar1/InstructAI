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
import com.screening.interviews.prompts.LearningResourcePrompts;
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

        // 7) Find YouTube videos for key terms
        List<String> allVideos = new ArrayList<>();

        // Find definition videos for each key term and add them to the combined list
        keyTerms.forEach((term, definition) -> {
            List<String> termVideos = findDefinitionVideos(term, definition);
            if (!termVideos.isEmpty()) {
                // Take the first video for each term and add it directly to allVideos
                termVideos.stream().findFirst().ifPresent(allVideos::add);
            }
        });

        module.setVideoUrls(allVideos);
        moduleRepository.save(module);

        // 8) Build the final learning resource DTO
        LearningResourceDto result = LearningResourceDto.builder()
                .conceptTitle(conceptTitle)
                .moduleTitle(moduleTitle)
                .content(mainContent)
                .transcript(transcript)
                .videoUrls(allVideos)
                .subModules(persistedSubModules)
                .quizzes(persistedQuizzes)
                .build();

        userModuleProgressService.updateTotalSubmodules(moduleId);

        logger.info("Successfully generated learning resource for concept: {}", conceptTitle);
        return result;
    }

    private String generateMainContent(String conceptTitle, String moduleTitle) {
        logger.info("Generating main content for concept: {}", conceptTitle);
        String mainContentPrompt = LearningResourcePrompts.mainContentPrompt(conceptTitle, moduleTitle);
        return callGeminiApi(mainContentPrompt);
    }

    private String generateTranscript(String conceptTitle) {
        String transcriptPrompt = LearningResourcePrompts.transcriptPrompt(conceptTitle);
        return callGeminiApi(transcriptPrompt);
    }

    public Map<String, String> analyzeTopicAndExtractKeyTerms(String conceptTitle, String moduleTitle) {
        logger.info("Analyzing topic complexity and extracting key terms for: {}", conceptTitle);

        String analysisPrompt = LearningResourcePrompts.topicAnalysisPrompt(conceptTitle, moduleTitle);
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
                    String term = entry.getKey();
                    String definition = entry.getValue().asText();

                    // Additional check to ensure term has proper context
                    if (!term.toLowerCase().contains(conceptTitle.toLowerCase()) && !isFullyQualifiedTerm(term, conceptTitle)) {
                        // Add domain context if missing
                        term = addDomainContext(term, conceptTitle);
                    }

                    keyTerms.put(term, definition);
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

    /**
     * Checks if a term already has proper domain-specific context
     */
    private boolean isFullyQualifiedTerm(String term, String domain) {
        // Consider a term fully qualified if:
        // 1. It includes any part of the domain name
        // 2. It's a common technical term that doesn't need domain qualification

        String lowercaseTerm = term.toLowerCase();
        String lowercaseDomain = domain.toLowerCase();

        // Split domain into words and check if any are in the term
        String[] domainWords = lowercaseDomain.split("\\s+");
        for (String word : domainWords) {
            if (word.length() > 3 && lowercaseTerm.contains(word)) {
                return true;
            }
        }

        // List of common technical terms that don't need domain qualification
        List<String> commonTechnicalTerms = Arrays.asList(
                "api", "rest", "json", "xml", "http", "tcp/ip", "database",
                "algorithm", "interface", "framework", "architecture", "protocol"
        );

        for (String commonTerm : commonTechnicalTerms) {
            if (lowercaseTerm.equals(commonTerm) || lowercaseTerm.startsWith(commonTerm + " ")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Adds domain context to terms that lack it
     */
    private String addDomainContext(String term, String domain) {
        // For multi-word domains, use the first word as prefix if appropriate
        String contextPrefix = domain.split("\\s+")[0];

        // Check if term already starts with some context
        if (term.toLowerCase().startsWith(contextPrefix.toLowerCase())) {
            return term;
        }

        // For certain terms, use the full domain
        if (term.toLowerCase().equals("basics") ||
                term.toLowerCase().equals("fundamentals") ||
                term.toLowerCase().equals("principles") ||
                term.toLowerCase().equals("concepts") ||
                term.toLowerCase().equals("introduction")) {
            return domain + " " + term;
        }

        // For other technical terms, use the domain as prefix
        return contextPrefix + " " + term;
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
        String introPrompt = LearningResourcePrompts.introductionSubmodulePrompt(conceptTitle);
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
        String termPrompt = LearningResourcePrompts.termSubmodulePrompt(term, definition, conceptTitle);
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

        String advancedPrompt = LearningResourcePrompts.advancedApplicationSubmodulePrompt(conceptTitle, termsList);
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

    public List<String> findDefinitionVideos(String term, String definition) {
        logger.info("Searching for definition videos for term: {}", term);
        // Search for definition-style videos for key terms
        String searchQuery = term + " " + definition;
        return findRelevantYouTubeVideos(searchQuery, 1);
    }

    public List<String> findRelevantYouTubeVideos(String topic, int maxResults) {
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
        String basicQuizPrompt = LearningResourcePrompts.basicQuizPrompt(conceptTitle);
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
        String advancedQuizPrompt = LearningResourcePrompts.advancedQuizPrompt(conceptTitle);
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

    public List<QuizDto> generateMultipleQuiz(List<String> conceptTitles) {
        List<QuizDto> quizzes = new ArrayList<>();
        for (String conceptTitle : conceptTitles) {
            QuizDto quiz = generateQuiz(conceptTitle);
            quizzes.add(quiz);
        }
        return quizzes;
    }

    public QuizDto generateQuiz(String term) {
        logger.info("Creating quiz for term: {}", term);

        // Sanitize inputs to handle special characters safely
        String safeTerm = sanitizeInput(term);

        // Use the standard quiz prompt from the prompts class
        String quizPrompt = LearningResourcePrompts.standardQuizPrompt(safeTerm);

        // Call Gemini with the enhanced prompt
        String quizJson = callGeminiForQuiz(quizPrompt);
        List<QuestionDto> questions = parseQuizQuestions(quizJson);

        return QuizDto.builder()
                .quizTitle(term + " Quiz")
                .description("Test your understanding of " + term)
                .difficulty("Intermediate")
                .timeLimit("5 minutes")
                .questions(questions)
                .passingScore(70)
                .build();
    }

    private String callGeminiForQuiz(String prompt) {
        try {
            // Properly escape the prompt for JSON payload
            String escapedPrompt = objectMapper.writeValueAsString(prompt);
            escapedPrompt = escapedPrompt.substring(1, escapedPrompt.length() - 1);

            // Construct a cleaner payload using the approach from InteractiveCourseService
            String payload = String.format("""
        {
            "contents": [{
                "parts": [{
                    "text": "%s"
                }]
            }]
        }
        """, escapedPrompt);

            logger.info("Calling Gemini API for quiz generation...");
            String rawResponse = geminiWebClient.post()
                    .uri("") // URL is already set in the WebClient bean
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {}", rawResponse);
            }

            // Extract the text using the more reliable method from InteractiveCourseService
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String generatedText = textNode.asText();

            if (generatedText == null || generatedText.trim().isEmpty()) {
                logger.warn("Gemini API returned empty text content");
                return LearningResourcePrompts.fallbackQuizJson();
            }

            // Clean up any potential formatting issues
            generatedText = generatedText.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Validate JSON before returning
            try {
                objectMapper.readTree(generatedText);
                return generatedText;
            } catch (Exception e) {
                logger.warn("Generated text is not valid JSON: {}", e.getMessage());
                return cleanAndRepairJson(generatedText);
            }

        } catch (Exception e) {
            logger.error("Error calling Gemini API for quiz: {}", e.getMessage());
            return LearningResourcePrompts.fallbackQuizJson();
        }
    }

    private String cleanAndRepairJson(String potentialJson) {
        try {
            // First remove any text before the first { and after the last }
            int firstBrace = potentialJson.indexOf('{');
            int lastBrace = potentialJson.lastIndexOf('}');

            if (firstBrace >= 0 && lastBrace > firstBrace) {
                potentialJson = potentialJson.substring(firstBrace, lastBrace + 1);
            }

            // Common replacements for malformed JSON
            potentialJson = potentialJson
                    .replaceAll("\\\\\"", "\"") // Fix escaped quotes
                    .replaceAll(",\\s*}", "}") // Remove trailing commas
                    .replaceAll(",\\s*]", "]") // Remove trailing commas in arrays
                    .replaceAll("([{,])\\s*\"?(\\w+)\"?\\s*:", "$1\"$2\":") // Ensure keys are quoted
                    .replaceAll("\"\\s*:\\s*\"([^\"]+)\"\\s*([,}])", "\":\"$1\"$2") // Fix string values
                    .replaceAll("(\\d),([0-9])", "$1.$2"); // Fix numbers (if commas used instead of dots)

            // Try to parse the JSON now
            objectMapper.readTree(potentialJson);
            return potentialJson;
        } catch (Exception e) {
            logger.error("Failed to repair JSON: {}", e.getMessage());
            return LearningResourcePrompts.fallbackQuizJson();
        }
    }

    private String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }
        // Escape quotes to prevent JSON injection and normalize whitespace
        return input.replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ")
                .trim();
    }

    private List<QuestionDto> parseQuizQuestions(String quizJson) {
        List<QuestionDto> questions = new ArrayList<>();

        try {
            // Attempt to parse the JSON
            JsonNode root = objectMapper.readTree(quizJson);
            JsonNode questionsNode = root.has("questions") ? root.get("questions") : root;

            // If questions is not an array, handle the error gracefully
            if (!questionsNode.isArray()) {
                logger.warn("Questions node is not an array. Using fallback questions.");
                return createFallbackQuestions();
            }

            // Process each question
            for (JsonNode questionNode : questionsNode) {
                try {
                    // Extract required fields with careful null checks
                    String questionText = questionNode.has("question") ?
                            questionNode.get("question").asText() : null;

                    if (questionText == null || questionText.trim().isEmpty()) {
                        logger.warn("Question text is missing or empty, skipping");
                        continue;
                    }

                    // Extract options with error handling
                    List<String> options = new ArrayList<>();
                    if (questionNode.has("options") && questionNode.get("options").isArray()) {
                        JsonNode optionsNode = questionNode.get("options");
                        for (JsonNode option : optionsNode) {
                            options.add(option.asText());
                        }
                    }

                    // If no options were found, skip this question
                    if (options.isEmpty()) {
                        logger.warn("No options found for question: {}", questionText);
                        continue;
                    }

                    // Extract correctAnswer with fallback to first option
                    String correctAnswer = "A"; // Default to first option
                    if (questionNode.has("correctAnswer")) {
                        correctAnswer = questionNode.get("correctAnswer").asText();
                        // If correct answer is just a number, convert to letter
                        if (correctAnswer.matches("\\d+")) {
                            int index = Integer.parseInt(correctAnswer);
                            correctAnswer = String.valueOf((char)('A' + (index - 1)));
                        }
                        // If it's just a letter without the A. format, ensure it's capitalized
                        if (correctAnswer.length() == 1) {
                            correctAnswer = correctAnswer.toUpperCase();
                        }
                        // If it's in the "A. Answer" format, extract just the letter
                        if (correctAnswer.contains(".")) {
                            correctAnswer = correctAnswer.substring(0, 1).toUpperCase();
                        }
                    }

                    // Extract explanation with fallback
                    String explanation = "Correct answer based on the term definition.";
                    if (questionNode.has("explanation")) {
                        explanation = questionNode.get("explanation").asText();
                    }

                    // Create and add the question
                    QuestionDto question = QuestionDto.builder()
                            .question(questionText)
                            .options(options)
                            .correctAnswer(correctAnswer)
                            .explanation(explanation)
                            .build();

                    questions.add(question);

                } catch (Exception e) {
                    logger.warn("Error processing individual question: {}", e.getMessage());
                    // Continue to the next question rather than failing the entire process
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing quiz JSON: {}", e.getMessage());
        }

        // If no valid questions were created, use fallback questions
        if (questions.isEmpty()) {
            logger.warn("No valid questions were parsed. Using fallback questions.");
            return createFallbackQuestions();
        }

        return questions;
    }

    private List<QuestionDto> createFallbackQuestions() {
        List<QuestionDto> fallbackQuestions = new ArrayList<>();

        fallbackQuestions.add(QuestionDto.builder()
                .question("What is the main concept being described?")
                .options(Arrays.asList(
                        "A. A fundamental principle",
                        "B. An advanced technique",
                        "C. A specialized tool",
                        "D. A theoretical framework"))
                .correctAnswer("A")
                .explanation("The term refers to a fundamental concept.")
                .build());

        fallbackQuestions.add(QuestionDto.builder()
                .question("How is this concept typically applied?")
                .options(Arrays.asList(
                        "A. In theoretical research",
                        "B. In practical applications",
                        "C. In academic discussions",
                        "D. In historical contexts"))
                .correctAnswer("B")
                .explanation("The concept is most valuable in practical scenarios.")
                .build());

        fallbackQuestions.add(QuestionDto.builder()
                .question("What is a key benefit of understanding this concept?")
                .options(Arrays.asList(
                        "A. Improved problem-solving",
                        "B. Better communication",
                        "C. Enhanced creativity",
                        "D. Stronger analytical skills"))
                .correctAnswer("A")
                .explanation("Understanding this concept enhances problem-solving abilities.")
                .build());

        fallbackQuestions.add(QuestionDto.builder()
                .question("Which field most commonly uses this concept?")
                .options(Arrays.asList(
                        "A. Science",
                        "B. Engineering",
                        "C. Business",
                        "D. Education"))
                .correctAnswer("B")
                .explanation("This concept is most frequently applied in engineering contexts.")
                .build());

        fallbackQuestions.add(QuestionDto.builder()
                .question("What is most closely related to this concept?")
                .options(Arrays.asList(
                        "A. Methodologies",
                        "B. Frameworks",
                        "C. Principles",
                        "D. Tools"))
                .correctAnswer("C")
                .explanation("The concept is most closely related to fundamental principles.")
                .build());

        return fallbackQuestions;
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