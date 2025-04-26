package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.*;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import com.screening.interviews.prompts.ModuleContentPrompts;
import com.screening.interviews.fallback.ModuleContentFallback;

import java.lang.Thread;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleContentService {

    private static final Logger logger = LoggerFactory.getLogger(ModuleContentService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final SubModuleRepository subModuleRepository;
    private final ModuleRepository moduleRepository;
    private final QuizRepository quizRepository;
    private final ProgressService userModuleProgressService;
    private final UserModuleStepProgressRepository userModuleStepProgressRepository;
    private final UserModuleProgressRepository userModuleProgressRepository;
    private final UserRepository userRepository;
    private final ProgressService progressService;

    private static final String YOUTUBE_API_KEY = "AIzaSyCItvhHeCz5v3eQRp3SziAvHk-2XUUKg1Q";
    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    private final ExecutorService executorService = Executors.newFixedThreadPool(3);
    public TermContentResponseDto generateTermContent(TermContentRequestDto request) {
        logger.info("Starting term content generation for term: {}", request.getTerm());

        String term = request.getTerm();
        String definition = request.getDefinition();
        Long moduleId = request.getModuleId();

        // Validate input
        if (term == null || term.trim().isEmpty()) {
            throw new IllegalArgumentException("Term cannot be empty");
        }

        if (definition == null || definition.trim().isEmpty()) {
            throw new IllegalArgumentException("Definition cannot be empty");
        }

        if (moduleId == null) {
            throw new IllegalArgumentException("Module ID is required");
        }

        // Check if module exists
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found with ID: " + moduleId));

        try {
            // Execute the three main tasks in parallel using CompletableFuture
            CompletableFuture<SubModuleDto> subModuleFuture = CompletableFuture.supplyAsync(
                    () -> createTermSubModule(term, definition, request.getContextTitle()),
                    executorService
            );

            CompletableFuture<List<String>> videoUrlsFuture = CompletableFuture.supplyAsync(
                    () -> findDefinitionVideos(term, ""),
                    executorService
            );

            CompletableFuture<QuizDto> quizFuture = CompletableFuture.supplyAsync(
                    () -> createTermQuiz(term, definition, request.getContextTitle()),
                    executorService
            );

            // Wait for all tasks to complete
            CompletableFuture.allOf(subModuleFuture, videoUrlsFuture, quizFuture).join();

            // Retrieve results from completed futures
            SubModuleDto subModule = subModuleFuture.get();
            List<String> videoUrls = videoUrlsFuture.get();
            QuizDto quiz = quizFuture.get();

            log.info("subModule is created {}", subModule);

            String videoUrl = videoUrls.isEmpty() ? null : videoUrls.get(0);

            // Variables to store IDs for the response
            Long subModuleId = null;
            Long quizId = null;

            // 4. Persist the content if requested
            if (Boolean.TRUE.equals(request.getSaveContent())) {
                // Save the submodule
                subModule.setModuleId(moduleId);
                SubModule savedSubModule = subModuleRepository.save(convertToSubModule(subModule));
                subModule = convertToSubModuleDto(savedSubModule);
                subModuleId = savedSubModule.getId(); // Store the generated ID

                // Save the quiz
                Quiz quizEntity = convertToQuiz(quiz, moduleId);
                Quiz savedQuiz = quizRepository.save(quizEntity);
                quiz = convertToQuizDto(savedQuiz);
                quizId = savedQuiz.getId(); // Store the generated ID

                // Add video URL to module if not already present
                if (videoUrl != null) {
                    List<String> existingVideos = module.getVideoUrls();
                    if (existingVideos == null) {
                        existingVideos = new ArrayList<>();
                    }

                    if (!existingVideos.contains(videoUrl)) {
                        existingVideos.add(videoUrl);
                        module.setVideoUrls(existingVideos);
                        moduleRepository.save(module);
                    }
                }

                // Update module progress trackers
                userModuleProgressService.updateTotalSubmodules(moduleId);
            }

            // 5. Build and return the response with IDs included
            return TermContentResponseDto.builder()
                    .term(term)
                    .definition(definition)
                    .subModule(subModule)
                    .quiz(quiz)
                    .videoUrl(videoUrl)
                    .subModuleId(subModuleId) // Include submodule ID in response
                    .quizId(quizId) // Include quiz ID in response
                    .build();

        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error during parallel processing of term content: {}", e.getMessage());
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to generate term content due to concurrent execution error", e);
        }
    }

    public void shutdown() {
        executorService.shutdown();
    }

    public KeyTermResponseDto extractTheKeyTerms(KeyTermRequestDto request) {
        String conceptTitle = request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle();
        String moduleTitle = request.getModuleTitle();
        Long moduleId = request.getModuleId();

        logger.info("Starting key terms extraction for concept: {}, module: {}", conceptTitle, moduleTitle);

        // Analyze the topic complexity and identify key terms
        Map<String, String> keyTermsMap = analyzeTopicAndExtractKeyTerms(conceptTitle, moduleTitle);

        // Convert the key terms map into a list of KeyTerm objects
        List<KeyTermResponseDto.KeyTerm> keyTermsList = new ArrayList<>();

        for (Map.Entry<String, String> entry : keyTermsMap.entrySet()) {
            String term = entry.getKey();
            String definition = entry.getValue();

            KeyTermResponseDto.KeyTerm keyTerm = new KeyTermResponseDto.KeyTerm(term, definition);
            keyTermsList.add(keyTerm);
        }

        // Create and populate the KeyTermResponseDto
        KeyTermResponseDto response = new KeyTermResponseDto();
        response.setKeyTerms(keyTermsList);
        response.setConceptTitle(conceptTitle);
        response.setModuleTitle(moduleTitle);
        response.setModuleId(moduleId);

        return response;
    }

    public QuizDto createTermQuiz(String term, String definition, String contextTitle) {
        logger.info("Creating quiz for term: {}", term);

        String safeTerm = sanitizeInput(term);
        String safeDefinition = sanitizeInput(definition);
        String safeContext = contextTitle != null ? sanitizeInput(contextTitle) : safeTerm.split(" ")[0];

        String quizPrompt = ModuleContentPrompts.createTermQuiPrompt(safeTerm, safeDefinition, safeContext);

        String quizJson = callGeminiForQuiz(quizPrompt);
        List<QuestionDto> questions = parseQuizQuestions(quizJson);

        return QuizDto.builder()
                .quizTitle(safeTerm + " Quiz")
                .description("Test your understanding of " + safeTerm)
                .difficulty("Intermediate")
                .timeLimit("5 minutes")
                .questions(questions)
                .passingScore(70)
                .build();
    }


    private String callGeminiForQuiz(String prompt) {
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

            logger.info("Calling Gemini API for quiz generation...");
            String rawResponse = geminiWebClient.post()
                    .uri("")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {}", rawResponse);
            }

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
                return generateFallbackQuizJson();
            }

            generatedText = generatedText.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            try {
                objectMapper.readTree(generatedText);
                return generatedText;
            } catch (Exception e) {
                logger.warn("Generated text is not valid JSON: {}", e.getMessage());
                return cleanAndRepairJson(generatedText);
            }

        } catch (Exception e) {
            logger.error("Error calling Gemini API for quiz: {}", e.getMessage());
            return generateFallbackQuizJson();
        }
    }

    private String cleanAndRepairJson(String potentialJson) {
        try {
            int firstBrace = potentialJson.indexOf('{');
            int lastBrace = potentialJson.lastIndexOf('}');

            if (firstBrace >= 0 && lastBrace > firstBrace) {
                potentialJson = potentialJson.substring(firstBrace, lastBrace + 1);
            }

            potentialJson = potentialJson
                    .replaceAll("\\\\\"", "\"")
                    .replaceAll(",\\s*}", "}")
                    .replaceAll(",\\s*]", "]")
                    .replaceAll("([{,])\\s*\"?(\\w+)\"?\\s*:", "$1\"$2\":")
                    .replaceAll("\"\\s*:\\s*\"([^\"]+)\"\\s*([,}])", "\":\"$1\"$2")
                    .replaceAll("(\\d),([0-9])", "$1.$2");

            objectMapper.readTree(potentialJson);
            return potentialJson;
        } catch (Exception e) {
            logger.error("Failed to repair JSON: {}", e.getMessage());
            return generateFallbackQuizJson();
        }
    }

    private String generateFallbackQuizJson() {
        return ModuleContentFallback.FallBackQuizJson();
    }

    public Map<String, String> analyzeTopicAndExtractKeyTerms(String conceptTitle, String moduleTitle) {
        logger.info("Analyzing topic complexity and extracting key terms for: {}", conceptTitle);

        String analysisPrompt = ModuleContentPrompts.analyzeTopicAndExtractKeyTermsPrompt(conceptTitle, moduleTitle);

        String analysisResult = callGeminiApi(analysisPrompt);

        Map<String, String> keyTerms = new HashMap<>();
        try {
            analysisResult = analysisResult.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            int firstBrace = analysisResult.indexOf('{');
            int lastBrace = analysisResult.lastIndexOf('}');

            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                analysisResult = analysisResult.substring(firstBrace, lastBrace + 1);

                JsonNode termsNode = objectMapper.readTree(analysisResult);

                termsNode.fields().forEachRemaining(entry -> {
                    String term = entry.getKey();
                    String definition = entry.getValue().asText();

                    if (!term.toLowerCase().contains(conceptTitle.toLowerCase()) && !isFullyQualifiedTerm(term, conceptTitle)) {
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
            logger.debug("Raw response from Gemini API: {}", analysisResult);

            keyTerms.put(conceptTitle + " basics", "Fundamental concepts of " + conceptTitle);
            keyTerms.put(conceptTitle + " implementation", "How to implement " + conceptTitle + " in practice");
        }

        return keyTerms;
    }

    private boolean isFullyQualifiedTerm(String term, String domain) {
        String lowercaseTerm = term.toLowerCase();
        String lowercaseDomain = domain.toLowerCase();

        String[] domainWords = lowercaseDomain.split("\\s+");
        for (String word : domainWords) {
            if (word.length() > 3 && lowercaseTerm.contains(word)) {
                return true;
            }
        }

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

    private String addDomainContext(String term, String domain) {
        String contextPrefix = domain.split("\\s+")[0];

        if (term.toLowerCase().startsWith(contextPrefix.toLowerCase())) {
            return term;
        }

        if (term.toLowerCase().equals("basics") ||
                term.toLowerCase().equals("fundamentals") ||
                term.toLowerCase().equals("principles") ||
                term.toLowerCase().equals("concepts") ||
                term.toLowerCase().equals("introduction")) {
            return domain + " " + term;
        }

        return contextPrefix + " " + term;
    }

    private SubModuleDto createTermSubModule(String term, String definition, String contextTitle) {
        String context = contextTitle != null ? contextTitle : term.split(" ")[0];

        logger.info("Creating submodule for term: {} in context: {}", term, context);

        String termPrompt = ModuleContentPrompts.createTermSubModulePrompt(term, context, definition);

        String termArticle = callGeminiApi(termPrompt);

        List<String> tags = generateTags(term, context);
        List<String> keywords = generateKeywords(term, context);

        return SubModuleDto.builder()
                .subModuleTitle(term)
                .article(termArticle)
                .tags(tags)
                .keywords(keywords)
                .readingTime("5-7 minutes")
                .build();
    }

    private List<String> generateTags(String term, String context) {
        List<String> tags = new ArrayList<>();
        tags.add("key-term");
        tags.add("definition");

        if (context != null && !context.isEmpty()) {
            tags.add(context.toLowerCase().replace(" ", "-"));
        }

        String domain = term.split(" ")[0].toLowerCase();
        if (!tags.contains(domain)) {
            tags.add(domain);
        }

        return tags;
    }

    private List<String> generateKeywords(String term, String context) {
        List<String> keywords = new ArrayList<>();

        keywords.add(term.toLowerCase());

        for (String word : term.split(" ")) {
            if (word.length() > 3 && !keywords.contains(word.toLowerCase())) {
                keywords.add(word.toLowerCase());
            }
        }

        if (context != null && !context.isEmpty()) {
            keywords.add(context.toLowerCase());
        }

        keywords.add("definition");

        return keywords;
    }

    public List<String> findDefinitionVideos(String term, String definition) {
        logger.info("Searching for definition videos for term: {}", term);
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

    private List<QuestionDto> parseQuizQuestions(String quizJson) {
        List<QuestionDto> questions = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(quizJson);
            JsonNode questionsNode = root.has("questions") ? root.get("questions") : root;

            if (!questionsNode.isArray()) {
                logger.warn("Questions node is not an array. Using fallback questions.");
                return createFallbackQuestions();
            }

            for (JsonNode questionNode : questionsNode) {
                try {
                    String questionText = questionNode.has("question") ?
                            questionNode.get("question").asText() : null;

                    if (questionText == null || questionText.trim().isEmpty()) {
                        logger.warn("Question text is missing or empty, skipping");
                        continue;
                    }

                    List<String> options = new ArrayList<>();
                    if (questionNode.has("options") && questionNode.get("options").isArray()) {
                        JsonNode optionsNode = questionNode.get("options");
                        for (JsonNode option : optionsNode) {
                            options.add(option.asText());
                        }
                    }

                    if (options.isEmpty()) {
                        logger.warn("No options found for question: {}", questionText);
                        continue;
                    }

                    String correctAnswer = "A";
                    if (questionNode.has("correctAnswer")) {
                        correctAnswer = questionNode.get("correctAnswer").asText();
                        if (correctAnswer.matches("\\d+")) {
                            int index = Integer.parseInt(correctAnswer);
                            correctAnswer = String.valueOf((char)('A' + (index - 1)));
                        }
                        if (correctAnswer.length() == 1) {
                            correctAnswer = correctAnswer.toUpperCase();
                        }
                        if (correctAnswer.contains(".")) {
                            correctAnswer = correctAnswer.substring(0, 1).toUpperCase();
                        }
                    }

                    String explanation = "Correct answer based on the term definition.";
                    if (questionNode.has("explanation")) {
                        explanation = questionNode.get("explanation").asText();
                    }

                    QuestionDto question = QuestionDto.builder()
                            .question(questionText)
                            .options(options)
                            .correctAnswer(correctAnswer)
                            .explanation(explanation)
                            .build();

                    questions.add(question);

                } catch (Exception e) {
                    logger.warn("Error processing individual question: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing quiz JSON: {}", e.getMessage());
        }

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

    private String cleanJsonString(String rawJson) {
        if (rawJson == null || rawJson.isEmpty()) {
            return "{\"questions\":[]}";
        }

        String cleaned = rawJson.trim();

        cleaned = cleaned.replaceAll("(?s)```json\\s*(.*?)\\s*```", "$1")
                .replaceAll("(?s)```\\s*(.*?)\\s*```", "$1");

        cleaned = cleaned.replace("<", "<")
                .replace(">", ">")
                .replace("&", "&");

        cleaned = cleaned.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");

        cleaned = cleaned.replaceAll("(?<!\\\\)(\")\\s*:\\s*\\1", "\" : \"");

        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        } else if (cleaned.contains("\"question\"")) {
            cleaned = "{\"questions\":[" + cleaned + "]}";
        } else {
            return "{\"questions\":[]}";
        }

        cleaned = cleaned.replaceAll(",\\s*([\\]}])", "$1") // Remove trailing commas
                .replaceAll("(\\]|\\})\\s*([{])", "$1,$2") // Add missing commas between objects
                .replaceAll("([a-zA-Z0-9_]+)\\s*:", "\"$1\":"); // Quote unquoted keys

        if (!cleaned.startsWith("{")) {
            cleaned = "{\"questions\":" + (cleaned.startsWith("[") ? cleaned : "[" + cleaned + "]") + "}";
        }

        logger.debug("Cleaned JSON: {}", cleaned);
        return cleaned;
    }

    private QuestionDto extractSingleQuestion(JsonNode questionNode) {
        try {
            String questionText = extractStringValue(questionNode, "question");
            if (questionText == null || questionText.trim().isEmpty()) {
                return null;
            }

            List<String> options = extractOptions(questionNode);
            String correctAnswer = extractStringValue(questionNode, "correctAnswer");

            if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
                correctAnswer = extractStringValue(questionNode, "correct_answer");
            }

            if (correctAnswer == null && questionNode.has("correctAnswerIndex")) {
                JsonNode indexNode = questionNode.get("correctAnswerIndex");
                if (indexNode.isInt() && indexNode.asInt() >= 0 && indexNode.asInt() < options.size()) {
                    correctAnswer = String.valueOf((char) ('A' + indexNode.asInt()));
                }
            }

            String explanation = extractStringValue(questionNode, "explanation");

            if (!options.isEmpty()) {
                return QuestionDto.builder()
                        .question(questionText)
                        .options(options)
                        .correctAnswer(correctAnswer)
                        .explanation(explanation)
                        .build();
            }
        } catch (Exception e) {
            logger.warn("Error extracting question: {}", e.getMessage());
        }
        return null;
    }

    private String extractStringValue(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName)) {
            return "";
        }
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode.isTextual() || fieldNode.isValueNode() ? fieldNode.asText() : "";
    }

    private List<String> extractOptions(JsonNode questionNode) {
        List<String> options = new ArrayList<>();
        if (questionNode == null || !questionNode.has("options")) {
            return options;
        }

        JsonNode optionsNode = questionNode.get("options");
        if (optionsNode.isArray()) {
            for (JsonNode option : optionsNode) {
                if (option.isTextual() || option.isValueNode()) {
                    options.add(option.asText());
                }
            }
        } else if (optionsNode.isTextual()) {
            String[] optionArray = optionsNode.asText().split("(?<=\\w\\.)\\s*");
            for (String option : optionArray) {
                String trimmed = option.trim();
                if (!trimmed.isEmpty()) {
                    options.add(trimmed);
                }
            }
        }
        return options;
    }

    private QuestionDto createDefaultQuestion() {
        return QuestionDto.builder()
                .question("What is the main focus of this topic?")
                .options(Arrays.asList(
                        "A. Understanding core concepts",
                        "B. Practical applications",
                        "C. Historical development",
                        "D. Future trends"))
                .correctAnswer("A")
                .explanation("Default question due to parsing failure.")
                .build();
    }

    private String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ")
                .trim();
    }

    /**
     * Improved extraction of options with better error handling
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
            String rawResponse = geminiWebClient.post()
                    .uri("") // URL is already set in the WebClient bean
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {}", rawResponse);
            }

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
                return "Content generation failed. Please try again.";
            }

            generatedText = generatedText.replaceAll("```markdown", "")
                    .replaceAll("```", "")
                    .trim();

            return generatedText;

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate content from Gemini API", e);
        }
    }

    public TermDetailResponseDto getTermDetailsWithProgress(Long userId, Long moduleId, Integer termIndex) {
        log.info("Fetching term details for user {} module {} term {}", userId, moduleId, termIndex);

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            return TermDetailResponseDto.builder()
                    .success(false)
                    .message("Invalid term index")
                    .build();
        }

        String term = module.getKeyTerms().get(termIndex);
        String definition = module.getDefinitions().get(termIndex);

        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        boolean isTermCompleted = progress.isTermCompleted(termIndex);
        boolean isLastTerm = (termIndex == module.getKeyTerms().size() - 1);

        int nextTermIndex = termIndex + 1;
        boolean nextTermUnlocked = !isLastTerm && progress.isTermUnlocked(nextTermIndex);

        TermResourceProgressDto resourceProgress = getTermResourceProgress(userId, moduleId, termIndex);

        if (!resourceProgress.isArticleAvailable() || !resourceProgress.isQuizAvailable()) {
            generateTermResourcesIfNeeded(userId, moduleId, termIndex, term, definition);

            resourceProgress = getTermResourceProgress(userId, moduleId, termIndex);
        }

        SubModuleDto article = null;
        QuizDto quiz = null;
        String videoUrl = null;

        if (resourceProgress.isArticleAvailable() && resourceProgress.getArticleId() != null) {
            SubModule subModule = subModuleRepository.findById(resourceProgress.getArticleId())
                    .orElse(null);
            if (subModule != null) {
                article = convertToSubModuleDto(subModule);
            }
        }

        if (resourceProgress.isQuizAvailable() && resourceProgress.getQuizId() != null) {
            Quiz quizEntity = quizRepository.findById(resourceProgress.getQuizId())
                    .orElse(null);
            if (quizEntity != null) {
                quiz = convertToQuizDto(quizEntity);
            }
        }

        if (resourceProgress.isVideoAvailable() && resourceProgress.getVideoId() != null) {
            if (module.getVideoUrls() != null) {
                for (String url : module.getVideoUrls()) {
                    if (url.contains(resourceProgress.getVideoId())) {
                        videoUrl = url;
                        break;
                    }
                }
            }

            if (videoUrl == null) {
                try {
                    if (progress.getTermResourcesData() != null) {
                        Map<String, Object> allTermResources = objectMapper.readValue(
                                progress.getTermResourcesData(), Map.class);

                        if (allTermResources.containsKey(termIndex.toString())) {
                            Map<String, Object> termResources =
                                    (Map<String, Object>) allTermResources.get(termIndex.toString());

                            if (termResources.containsKey("videoUrl")) {
                                videoUrl = (String) termResources.get("videoUrl");
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error fetching video URL from term resources: {}", e.getMessage());
                }
            }
        }

        return TermDetailResponseDto.builder()
                .success(true)
                .term(term)
                .definition(definition)
                .termIndex(termIndex)
                .article(article)
                .quiz(quiz)
                .videoUrl(videoUrl)
                .isCompleted(isTermCompleted)
                .resourceProgress(resourceProgress)
                .isLastTerm(isLastTerm)
                .nextTermIndex(isLastTerm ? null : nextTermIndex)
                .nextTermUnlocked(nextTermUnlocked)
                .build();
    }

    private TermResourceProgressDto getTermResourceProgress(Long userId, Long moduleId, Integer termIndex) {
        TermResourceProgressDto progress = new TermResourceProgressDto();

        UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        try {
            if (moduleProgress.getTermResourcesData() != null) {
                Map<String, Object> allTermResources = objectMapper.readValue(
                        moduleProgress.getTermResourcesData(), Map.class);

                if (allTermResources.containsKey(termIndex.toString())) {
                    Map<String, Object> termResources =
                            (Map<String, Object>) allTermResources.get(termIndex.toString());

                    if (termResources.containsKey("subModuleId")) {
                        Long articleId = Long.valueOf(termResources.get("subModuleId").toString());
                        progress.setArticleAvailable(true);
                        progress.setArticleId(articleId);
                        progress.setArticleCompleted(Boolean.TRUE.equals(termResources.get("articleCompleted")));
                        progress.setArticleStarted(progress.isArticleCompleted() ||
                                Boolean.TRUE.equals(termResources.get("articleStarted")));

                        if (termResources.containsKey("articleProgress")) {
                            progress.setArticleProgress(
                                    Integer.valueOf(termResources.get("articleProgress").toString()));
                        } else {
                            progress.setArticleProgress(progress.isArticleCompleted() ? 100 : 0);
                        }
                    }

                    if (termResources.containsKey("quizId")) {
                        Long quizId = Long.valueOf(termResources.get("quizId").toString());
                        progress.setQuizAvailable(true);
                        progress.setQuizId(quizId);
                        progress.setQuizCompleted(Boolean.TRUE.equals(termResources.get("quizCompleted")));
                        progress.setQuizStarted(progress.isQuizCompleted() ||
                                Boolean.TRUE.equals(termResources.get("quizStarted")));

                        if (termResources.containsKey("quizScore")) {
                            progress.setQuizScore(
                                    Integer.valueOf(termResources.get("quizScore").toString()));
                        }
                    }

                    if (termResources.containsKey("videoId")) {
                        String videoId = termResources.get("videoId").toString();
                        progress.setVideoAvailable(true);
                        progress.setVideoId(videoId);
                        progress.setVideoCompleted(Boolean.TRUE.equals(termResources.get("videoCompleted")));
                        progress.setVideoStarted(progress.isVideoCompleted() ||
                                Boolean.TRUE.equals(termResources.get("videoStarted")));

                        if (termResources.containsKey("videoProgress")) {
                            progress.setVideoProgress(
                                    Integer.valueOf(termResources.get("videoProgress").toString()));
                        } else {
                            progress.setVideoProgress(progress.isVideoCompleted() ? 100 : 0);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error retrieving term progress: {}", e.getMessage());
        }

        if (progress.isArticleAvailable() || progress.isQuizAvailable() || progress.isVideoAvailable()) {
            try {
                if (progress.isArticleAvailable() && progress.getArticleId() != null) {
                    userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
                                    userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, progress.getArticleId())
                            .ifPresent(step -> {
                                progress.setArticleStarted(
                                        step.getStatus() != UserModuleStepProgress.StepStatus.NOT_STARTED);
                                progress.setArticleCompleted(
                                        step.getStatus() == UserModuleStepProgress.StepStatus.COMPLETED);
                                if (step.getReadProgressPercentage() != null) {
                                    progress.setArticleProgress(step.getReadProgressPercentage());
                                }
                            });
                }

                if (progress.isQuizAvailable() && progress.getQuizId() != null) {
                    userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndQuizId(
                                    userId, moduleId, UserModuleStepProgress.StepType.QUIZ, progress.getQuizId())
                            .ifPresent(step -> {
                                progress.setQuizStarted(
                                        step.getStatus() != UserModuleStepProgress.StepStatus.NOT_STARTED);
                                progress.setQuizCompleted(
                                        step.getStatus() == UserModuleStepProgress.StepStatus.COMPLETED);
                                if (step.getBestScore() != null) {
                                    progress.setQuizScore(step.getBestScore());
                                }
                            });
                }

                if (progress.isVideoAvailable() && progress.getVideoId() != null) {
                    userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndVideoId(
                                    userId, moduleId, UserModuleStepProgress.StepType.VIDEO, progress.getVideoId())
                            .ifPresent(step -> {
                                progress.setVideoStarted(
                                        step.getStatus() != UserModuleStepProgress.StepStatus.NOT_STARTED);
                                progress.setVideoCompleted(
                                        step.getStatus() == UserModuleStepProgress.StepStatus.COMPLETED);
                                if (step.getWatchProgressPercentage() != null) {
                                    progress.setVideoProgress(step.getWatchProgressPercentage());
                                }
                            });
                }
            } catch (Exception e) {
                log.error("Error retrieving step progress: {}", e.getMessage());
            }
        }

        return progress;
    }

    @Transactional
    public void generateTermResourcesIfNeeded(Long userId, Long moduleId, Integer termIndex,
                                              String term, String definition) {
        log.info("Checking if term resources need to be generated for term {}", termIndex);

        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        boolean resourcesExist = false;

        try {
            if (progress.getTermResourcesData() != null) {
                Map<String, Object> allTermResources = objectMapper.readValue(
                        progress.getTermResourcesData(), Map.class);

                if (allTermResources.containsKey(termIndex.toString())) {
                    Map<String, Object> termResources =
                            (Map<String, Object>) allTermResources.get(termIndex.toString());

                    if (termResources.containsKey("subModuleId") && termResources.containsKey("quizId")) {
                        resourcesExist = true;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error checking existing term resources: {}", e.getMessage());
        }

        if (!resourcesExist) {
            log.info("Generating resources for term {}: {}", termIndex, term);

            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            String contextTitle = module.getTitle();

            TermContentRequestDto request = TermContentRequestDto.builder()
                    .term(term)
                    .definition(definition)
                    .moduleId(moduleId)
                    .contextTitle(contextTitle)
                    .saveContent(true)
                    .build();

            TermContentResponseDto response = generateTermContent(request);

            Map<String, Object> termResources = new HashMap<>();

            if (response.getSubModule() != null && response.getSubModuleId() != null) {
                termResources.put("subModuleId", response.getSubModuleId());
                termResources.put("articleStarted", false);
                termResources.put("articleCompleted", false);
                termResources.put("articleProgress", 0);
            }

            if (response.getQuiz() != null && response.getQuizId() != null) {
                termResources.put("quizId", response.getQuizId());
                termResources.put("quizStarted", false);
                termResources.put("quizCompleted", false);
                termResources.put("quizScore", 0);
            }

            if (response.getVideoUrl() != null) {
                String videoId = extractVideoId(response.getVideoUrl());
                termResources.put("videoId", videoId);
                termResources.put("videoUrl", response.getVideoUrl());
                termResources.put("videoStarted", false);
                termResources.put("videoCompleted", false);
                termResources.put("videoProgress", 0);
            }

            progressService.saveTermResources(userId, moduleId, termIndex, termResources);

            createStepProgressForTermResources(userId, moduleId, termIndex, response);
        }
    }

    private void createStepProgressForTermResources(Long userId, Long moduleId, Integer termIndex,
                                                    TermContentResponseDto resources) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.KEY_TERM, termIndex)
                    .orElseGet(() -> {
                        UserModuleStepProgress keyTermStep = UserModuleStepProgress.builder()
                                .user(user)
                                .module(module)
                                .userModuleProgress(moduleProgress)
                                .stepType(UserModuleStepProgress.StepType.KEY_TERM)
                                .keyTermIndex(termIndex)
                                .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                                .build();
                        return userModuleStepProgressRepository.save(keyTermStep);
                    });

            if (resources.getSubModuleId() != null) {
                SubModule subModule = subModuleRepository.findById(resources.getSubModuleId())
                        .orElseThrow(() -> new ResourceNotFoundException("SubModule not found"));

                userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
                                userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, resources.getSubModuleId())
                        .orElseGet(() -> {
                            UserModuleStepProgress articleStep = UserModuleStepProgress.builder()
                                    .user(user)
                                    .module(module)
                                    .userModuleProgress(moduleProgress)
                                    .subModule(subModule)
                                    .stepType(UserModuleStepProgress.StepType.ARTICLE)
                                    .keyTermIndex(termIndex)
                                    .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                                    .readProgressPercentage(0)
                                    .build();
                            return userModuleStepProgressRepository.save(articleStep);
                        });
            }

            if (resources.getQuizId() != null) {
                Quiz quiz = quizRepository.findById(resources.getQuizId())
                        .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

                userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndQuizId(
                                userId, moduleId, UserModuleStepProgress.StepType.QUIZ, resources.getQuizId())
                        .orElseGet(() -> {
                            UserModuleStepProgress quizStep = UserModuleStepProgress.builder()
                                    .user(user)
                                    .module(module)
                                    .userModuleProgress(moduleProgress)
                                    .quiz(quiz)
                                    .stepType(UserModuleStepProgress.StepType.QUIZ)
                                    .keyTermIndex(termIndex)
                                    .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                                    .build();
                            return userModuleStepProgressRepository.save(quizStep);
                        });
            }

            if (resources.getVideoUrl() != null) {
                String videoId = extractVideoId(resources.getVideoUrl());

                userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndVideoId(
                                userId, moduleId, UserModuleStepProgress.StepType.VIDEO, videoId)
                        .orElseGet(() -> {
                            UserModuleStepProgress videoStep = UserModuleStepProgress.builder()
                                    .user(user)
                                    .module(module)
                                    .userModuleProgress(moduleProgress)
                                    .videoId(videoId)
                                    .stepType(UserModuleStepProgress.StepType.VIDEO)
                                    .keyTermIndex(termIndex)
                                    .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                                    .watchProgressPercentage(0)
                                    .build();
                            return userModuleStepProgressRepository.save(videoStep);
                        });
            }
        } catch (Exception e) {
            log.error("Error creating step progress entries: {}", e.getMessage());
        }
    }

    private String extractVideoId(String videoUrl) {
        if (videoUrl == null || videoUrl.isEmpty()) {
            return null;
        }

        try {
            if (videoUrl.contains("youtube.com/watch")) {
                return videoUrl.split("v=")[1].split("&")[0];
            } else if (videoUrl.contains("youtu.be/")) {
                return videoUrl.split("youtu.be/")[1].split("\\?")[0];
            }
        } catch (Exception e) {
            log.warn("Could not extract video ID from URL: {}", videoUrl);
        }

        return videoUrl;
    }
}