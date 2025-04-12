package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.*;
import com.screening.interviews.model.Module;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleContentService {

    private static final Logger logger = LoggerFactory.getLogger(ModuleContentService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final SubModuleRepository subModuleRepository;
    private final ModuleRepository moduleRepository;
    private final QuizRepository quizRepository;
    private final ProgressService userModuleProgressService;

    private static final String YOUTUBE_API_KEY = "AIzaSyCItvhHeCz5v3eQRp3SziAvHk-2XUUKg1Q";
    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    private final ExecutorService executorService = Executors.newFixedThreadPool(3);

    /**
     * Generate content for a single term and definition
     * Creates a submodule, quiz, and finds relevant video content
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
                    () -> findDefinitionVideos(term, definition),
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

            String videoUrl = videoUrls.isEmpty() ? null : videoUrls.get(0);

            // 4. Persist the content if requested
            if (Boolean.TRUE.equals(request.getSaveContent())) {
                // Save the submodule
                subModule.setModuleId(moduleId);
                SubModule savedSubModule = subModuleRepository.save(convertToSubModule(subModule));
                subModule = convertToSubModuleDto(savedSubModule);

                // Save the quiz
                Quiz quizEntity = convertToQuiz(quiz, moduleId);
                Quiz savedQuiz = quizRepository.save(quizEntity);
                quiz = convertToQuizDto(savedQuiz);

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

            // 5. Build and return the response
            return TermContentResponseDto.builder()
                    .term(term)
                    .definition(definition)
                    .subModule(subModule)
                    .quiz(quiz)
                    .videoUrl(videoUrl)
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
    private QuizDto createTermQuiz(String term, String definition, String contextTitle) {
        logger.info("Creating quiz for term: {}", term);

        String context = contextTitle != null ? contextTitle : term.split(" ")[0];

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
                term, definition, context
        );

        String quizJson = callGeminiApi(quizPrompt);
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

        // Fix colons used instead of commas in array elements
        // Pattern matches after a closing quote, bracket, or brace followed by a colon (when a comma should be used)
        cleaned = cleaned.replaceAll("(\"[^\"]*\"|\\}|\\])\\s*:\\s*(\"|\\\"|\\{|\\[)", "$1,$2");

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

        // Log the cleaned JSON for debugging
        logger.debug("Cleaned JSON: {}", cleaned);

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