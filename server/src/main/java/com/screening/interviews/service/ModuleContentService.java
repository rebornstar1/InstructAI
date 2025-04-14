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

    /**
     * Generate content for a single term and definition
     * Creates a submodule, quiz, and finds relevant video content
     */
    /**
     * Generate content for a single term and definition
     * Creates a submodule, quiz, and finds relevant video content
     * Now includes submodule ID in the response
     */
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

    /**
     * Create a quiz specifically for a single term/concept
     */
    public QuizDto createTermQuiz(String term, String definition, String contextTitle) {
        logger.info("Creating quiz for term: {}", term);

        // Sanitize inputs to handle special characters safely
        String safeTerm = sanitizeInput(term);
        String safeDefinition = sanitizeInput(definition);
        String safeContext = contextTitle != null ? sanitizeInput(contextTitle) : safeTerm.split(" ")[0];

        String quizPrompt = String.format(
                "Create a quiz focused specifically on '%s' with 5 multiple-choice questions. " +
                        "Begin with this definition as your foundation: '%s' " +
                        "For each question: " +
                        "1. Write questions that test understanding of different aspects and applications of this specific term " +
                        "2. Provide 4 answer options (A, B, C, D) with carefully designed distractors " +
                        "3. Indicate the correct answer " +
                        "4. Include a brief explanation for why the answer is correct " +
                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"...\", " +
                        "      \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"], " +
                        "      \"correctAnswer\": \"B\", " +
                        "      \"explanation\": \"...\" " +
                        "    } " +
                        "  ] " +
                        "} " +
                        "Include questions that test: definition recognition, key characteristics, practical applications, " +
                        "common misconceptions, and relationship to other related concepts in %s.",
                safeTerm, safeDefinition, safeContext
        );

        String quizJson = callGeminiApi(quizPrompt); // Placeholder for API call
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

    public Map<String, String> analyzeTopicAndExtractKeyTerms(String conceptTitle, String moduleTitle) {
        logger.info("Analyzing topic complexity and extracting key terms for: {}", conceptTitle);

        String analysisPrompt = String.format(
                "Analyze the topic '%s' in the context of module '%s' and identify 5-7 key terms or concepts " +
                        "that would benefit from detailed explanation. " +
                        "IMPORTANT: Focus on WELL-KNOWN, FUNDAMENTAL concepts that most beginners would need to understand. " +
                        "Avoid highly specialized or advanced technical terms. " +
                        "Each key term MUST be specific to the domain and maintain full context. " +
                        "For example, if the topic is 'Web Development', use 'Web Hooks' instead of just 'Hooks', " +
                        "or 'JavaScript Closures' instead of just 'Closures'. " +
                        "For each term, provide a short 1-2 sentence definition that is accessible to beginners. " +
                        "Format your response as a JSON object with the term as key and definition as value: " +
                        "{ " +
                        "  \"Domain-Specific Term 1\": \"definition1\", " +
                        "  \"Domain-Specific Term 2\": \"definition2\" " +
                        "} " +
                        "Focus on identifying terms that are: " +
                        "1. Core foundational concepts that everyone in this field should know " +
                        "2. Commonly referenced in introductory materials " +
                        "3. Broadly applicable rather than niche or specialized " +
                        "4. Important for building a solid understanding of the topic " +
                        "5. Frequently used in everyday discussions about this subject " +
                        "Remember: Every term MUST include the proper domain-specific context (e.g., '%s Hooks' not just 'Hooks') " +
                        "and should be recognizable to most people with basic knowledge of the field.",
                conceptTitle, moduleTitle, conceptTitle
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

    private SubModuleDto createTermSubModule(String term, String definition, String contextTitle) {
        String context = contextTitle != null ? contextTitle : term.split(" ")[0];

        logger.info("Creating submodule for term: {} in context: {}", term, context);

        String termPrompt = String.format(
                "Create a focused educational article about '%s' in the context of %s. " +
                        "The article should be approximately 400-500 words (5-7 minutes reading time). " +
                        "Begin with this definition as your starting point: '%s' " +
                        "Then structure the article as follows: " +
                        "1. Start with 2-3 specific learning objectives in bullet points " +
                        "2. Expand on the definition with more detail and context " +
                        "3. Explain why this term/concept is important in understanding %s " +
                        "4. Provide at least two clear, concrete examples of this term/concept in action " +
                        "5. Describe how this term/concept relates to other key ideas in %s " +
                        "6. Include a 'Visual Representation' section describing how this concept could be visualized " +
                        "7. Add 2-3 practice exercises or reflection questions related to this term " +
                        "8. Conclude with a 'Key Takeaways' section summarizing the most important points " +
                        "Use clear, accessible language appropriate for beginners and intermediate learners. " +
                        "Format with proper markdown using headings (##, ###), bullet points, emphasis (*italic*), " +
                        "strong emphasis (**bold**), code blocks where appropriate, and blockquotes for important notes.",
                term, context, definition, context, context
        );

        String termArticle = callGeminiApi(termPrompt);

        // Generate relevant tags and keywords
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

    /**
     * Generate appropriate tags for a term submodule
     */
    private List<String> generateTags(String term, String context) {
        List<String> tags = new ArrayList<>();
        tags.add("key-term");
        tags.add("definition");

        // Add the context as a tag if available
        if (context != null && !context.isEmpty()) {
            tags.add(context.toLowerCase().replace(" ", "-"));
        }

        // Add the primary domain as a tag
        String domain = term.split(" ")[0].toLowerCase();
        if (!tags.contains(domain)) {
            tags.add(domain);
        }

        return tags;
    }

    /**
     * Generate appropriate keywords for a term submodule
     */
    private List<String> generateKeywords(String term, String context) {
        List<String> keywords = new ArrayList<>();

        // Add the full term
        keywords.add(term.toLowerCase());

        // Add individual words from the term
        for (String word : term.split(" ")) {
            if (word.length() > 3 && !keywords.contains(word.toLowerCase())) {
                keywords.add(word.toLowerCase());
            }
        }

        // Add the context
        if (context != null && !context.isEmpty()) {
            keywords.add(context.toLowerCase());
        }

        // Add "definition" as a keyword
        keywords.add("definition");

        return keywords;
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

    private List<QuestionDto> parseQuizQuestions(String quizJson) {
        List<QuestionDto> questions = new ArrayList<>();

        try {
            String cleanedJson = cleanJsonString(quizJson);
            JsonNode root = objectMapper.readTree(cleanedJson);

            JsonNode questionsNode = root.has("questions") ? root.get("questions") : root;

            if (!questionsNode.isArray()) {
                logger.warn("Questions node is not an array. Attempting to extract single question.");
                QuestionDto question = extractSingleQuestion(questionsNode);
                if (question != null) {
                    questions.add(question);
                }
            } else {
                for (JsonNode questionNode : questionsNode) {
                    QuestionDto question = extractSingleQuestion(questionNode);
                    if (question != null) {
                        questions.add(question);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing quiz JSON: {}", e.getMessage(), e);
        }

        if (questions.isEmpty()) {
            logger.warn("No questions parsed. Generating default question.");
            questions.add(createDefaultQuestion());
        }

        return questions;
    }

    private String cleanJsonString(String rawJson) {
        if (rawJson == null || rawJson.isEmpty()) {
            return "{\"questions\":[]}";
        }

        String cleaned = rawJson.trim();

        // Remove Markdown and code block markers
        cleaned = cleaned.replaceAll("(?s)```json\\s*(.*?)\\s*```", "$1")
                .replaceAll("(?s)```\\s*(.*?)\\s*```", "$1");

        // Normalize HTML entities and decode common ones
        cleaned = cleaned.replace("<", "<")
                .replace(">", ">")
                .replace("&", "&");

        // Remove invalid control characters
        cleaned = cleaned.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");

        // Fix unescaped quotes in JSON values
        cleaned = cleaned.replaceAll("(?<!\\\\)(\")\\s*:\\s*\\1", "\" : \"");

        // Remove leading/trailing non-JSON content
        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        } else if (cleaned.contains("\"question\"")) {
            cleaned = "{\"questions\":[" + cleaned + "]}";
        } else {
            return "{\"questions\":[]}";
        }

        // Fix common JSON errors
        cleaned = cleaned.replaceAll(",\\s*([\\]}])", "$1") // Remove trailing commas
                .replaceAll("(\\]|\\})\\s*([{])", "$1,$2") // Add missing commas between objects
                .replaceAll("([a-zA-Z0-9_]+)\\s*:", "\"$1\":"); // Quote unquoted keys

        // Ensure proper JSON structure
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
        // Escape quotes to prevent JSON injection and normalize whitespace
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

    // Add this method to your existing ModuleContentService class

    /**
     * Get detailed information about a term, including its resources and progress
     */
    public TermDetailResponseDto getTermDetailsWithProgress(Long userId, Long moduleId, Integer termIndex) {
        log.info("Fetching term details for user {} module {} term {}", userId, moduleId, termIndex);

        // 1. Get the module to access key terms and definitions
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        // Validate term index
        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            return TermDetailResponseDto.builder()
                    .success(false)
                    .message("Invalid term index")
                    .build();
        }

        // 2. Get the term and definition
        String term = module.getKeyTerms().get(termIndex);
        String definition = module.getDefinitions().get(termIndex);

        // 3. Get module progress to check term status
        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        boolean isTermCompleted = progress.isTermCompleted(termIndex);
        boolean isLastTerm = (termIndex == module.getKeyTerms().size() - 1);

        // Next term information
        Integer nextTermIndex = termIndex + 1;
        boolean nextTermUnlocked = !isLastTerm && progress.isTermUnlocked(nextTermIndex);

        // 4. Retrieve or initialize resource progress
        TermResourceProgressDto resourceProgress = getTermResourceProgress(userId, moduleId, termIndex);

        // 5. If resources are not yet generated for this term, create them on-demand
        if (!resourceProgress.isArticleAvailable() || !resourceProgress.isQuizAvailable()) {
            // Term resources only need to be generated once
            generateTermResourcesIfNeeded(userId, moduleId, termIndex, term, definition);

            // Refresh progress after generation
            resourceProgress = getTermResourceProgress(userId, moduleId, termIndex);
        }

        // 6. Fetch resource content
        SubModuleDto article = null;
        QuizDto quiz = null;
        String videoUrl = null;

        // Fetch article (submodule) if available
        if (resourceProgress.isArticleAvailable() && resourceProgress.getArticleId() != null) {
            SubModule subModule = subModuleRepository.findById(resourceProgress.getArticleId())
                    .orElse(null);
            if (subModule != null) {
                article = convertToSubModuleDto(subModule);
            }
        }

        // Fetch quiz if available
        if (resourceProgress.isQuizAvailable() && resourceProgress.getQuizId() != null) {
            Quiz quizEntity = quizRepository.findById(resourceProgress.getQuizId())
                    .orElse(null);
            if (quizEntity != null) {
                quiz = convertToQuizDto(quizEntity);
            }
        }

        // Get video URL if available
        if (resourceProgress.isVideoAvailable() && resourceProgress.getVideoId() != null) {
            // First try to find in module's videos
            if (module.getVideoUrls() != null) {
                for (String url : module.getVideoUrls()) {
                    if (url.contains(resourceProgress.getVideoId())) {
                        videoUrl = url;
                        break;
                    }
                }
            }

            // If not found in module videos, it might be stored in term resources
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

        // 7. Build and return the response
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

    /**
     * Retrieve resource progress for a term
     */
    private TermResourceProgressDto getTermResourceProgress(Long userId, Long moduleId, Integer termIndex) {
        // Initialize progress tracker
        TermResourceProgressDto progress = new TermResourceProgressDto();

        // First check if we have any resources stored in term resources data
        UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        try {
            if (moduleProgress.getTermResourcesData() != null) {
                Map<String, Object> allTermResources = objectMapper.readValue(
                        moduleProgress.getTermResourcesData(), Map.class);

                if (allTermResources.containsKey(termIndex.toString())) {
                    Map<String, Object> termResources =
                            (Map<String, Object>) allTermResources.get(termIndex.toString());

                    // Check for article
                    if (termResources.containsKey("subModuleId")) {
                        Long articleId = Long.valueOf(termResources.get("subModuleId").toString());
                        progress.setArticleAvailable(true);
                        progress.setArticleId(articleId);
                        progress.setArticleCompleted(Boolean.TRUE.equals(termResources.get("articleCompleted")));
                        progress.setArticleStarted(progress.isArticleCompleted() ||
                                Boolean.TRUE.equals(termResources.get("articleStarted")));

                        // Get progress percentage if available
                        if (termResources.containsKey("articleProgress")) {
                            progress.setArticleProgress(
                                    Integer.valueOf(termResources.get("articleProgress").toString()));
                        } else {
                            progress.setArticleProgress(progress.isArticleCompleted() ? 100 : 0);
                        }
                    }

                    // Check for quiz
                    if (termResources.containsKey("quizId")) {
                        Long quizId = Long.valueOf(termResources.get("quizId").toString());
                        progress.setQuizAvailable(true);
                        progress.setQuizId(quizId);
                        progress.setQuizCompleted(Boolean.TRUE.equals(termResources.get("quizCompleted")));
                        progress.setQuizStarted(progress.isQuizCompleted() ||
                                Boolean.TRUE.equals(termResources.get("quizStarted")));

                        // Get best score if available
                        if (termResources.containsKey("quizScore")) {
                            progress.setQuizScore(
                                    Integer.valueOf(termResources.get("quizScore").toString()));
                        }
                    }

                    // Check for video
                    if (termResources.containsKey("videoId")) {
                        String videoId = termResources.get("videoId").toString();
                        progress.setVideoAvailable(true);
                        progress.setVideoId(videoId);
                        progress.setVideoCompleted(Boolean.TRUE.equals(termResources.get("videoCompleted")));
                        progress.setVideoStarted(progress.isVideoCompleted() ||
                                Boolean.TRUE.equals(termResources.get("videoStarted")));

                        // Get progress percentage if available
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

        // Also check step progress for more detailed status
        if (progress.isArticleAvailable() || progress.isQuizAvailable() || progress.isVideoAvailable()) {
            try {
                // Check for article progress in step progress
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

                // Check for quiz progress in step progress
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

                // Check for video progress in step progress
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

    /**
     * Generate resources for a term if they don't already exist
     */
    @Transactional
    public void generateTermResourcesIfNeeded(Long userId, Long moduleId, Integer termIndex,
                                              String term, String definition) {
        log.info("Checking if term resources need to be generated for term {}", termIndex);

        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        // Check if resources are already generated
        boolean resourcesExist = false;

        try {
            if (progress.getTermResourcesData() != null) {
                Map<String, Object> allTermResources = objectMapper.readValue(
                        progress.getTermResourcesData(), Map.class);

                // If we have resources for this term and they include article and quiz,
                // then we don't need to generate again
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

        // Generate resources if needed
        if (!resourcesExist) {
            log.info("Generating resources for term {}: {}", termIndex, term);

            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            // Context title is used for better AI prompt construction
            String contextTitle = module.getTitle();

            // Build request for term content generation
            TermContentRequestDto request = TermContentRequestDto.builder()
                    .term(term)
                    .definition(definition)
                    .moduleId(moduleId)
                    .contextTitle(contextTitle)
                    .saveContent(true)
                    .build();

            // Generate the content
            TermContentResponseDto response = generateTermContent(request);

            // Store the generated resources in term progress data
            Map<String, Object> termResources = new HashMap<>();

            // Store article info
            if (response.getSubModule() != null && response.getSubModuleId() != null) {
                termResources.put("subModuleId", response.getSubModuleId());
                termResources.put("articleStarted", false);
                termResources.put("articleCompleted", false);
                termResources.put("articleProgress", 0);
            }

            // Store quiz info
            if (response.getQuiz() != null && response.getQuizId() != null) {
                termResources.put("quizId", response.getQuizId());
                termResources.put("quizStarted", false);
                termResources.put("quizCompleted", false);
                termResources.put("quizScore", 0);
            }

            // Store video info
            if (response.getVideoUrl() != null) {
                String videoId = extractVideoId(response.getVideoUrl());
                termResources.put("videoId", videoId);
                termResources.put("videoUrl", response.getVideoUrl());
                termResources.put("videoStarted", false);
                termResources.put("videoCompleted", false);
                termResources.put("videoProgress", 0);
            }

            // Save the resources
            progressService.saveTermResources(userId, moduleId, termIndex, termResources);

            // Create step progress entries for these resources
            createStepProgressForTermResources(userId, moduleId, termIndex, response);
        }
    }

    /**
     * Create step progress entries for newly generated term resources
     */
    private void createStepProgressForTermResources(Long userId, Long moduleId, Integer termIndex,
                                                    TermContentResponseDto resources) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

            UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

            // Create parent key term step if needed
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

            // Create article step if article was generated
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

            // Create quiz step if quiz was generated
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

            // Create video step if video was found
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

    /**
     * Extract video ID from YouTube URL
     */
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

        // If not a recognizable YouTube URL format or extraction failed, return the URL itself
        return videoUrl;
    }
}