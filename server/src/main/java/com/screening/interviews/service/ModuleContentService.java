package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.Optional;
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
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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
    private final CacheService cacheService;

    // Cache TTL configurations
    private static final Duration TERM_CONTENT_TTL = Duration.ofHours(4);
    private static final Duration KEY_TERMS_TTL = Duration.ofHours(2);
    private static final Duration QUIZ_TTL = Duration.ofHours(3);
    private static final Duration SUBMODULE_TTL = Duration.ofHours(3);
    private static final Duration VIDEO_URLS_TTL = Duration.ofHours(6);
    private static final Duration TERM_DETAILS_TTL = Duration.ofMinutes(30);

    private static final String YOUTUBE_API_KEY = "AIzaSyCItvhHeCz5v3eQRp3SziAvHk-2XUUKg1Q";
    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

    private final ExecutorService executorService = Executors.newFixedThreadPool(3);

    public TermContentResponseDto generateTermContent(TermContentRequestDto request) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Starting term content generation for term: {} (User: rebornstar1, Time: {})",
                request.getTerm(), currentTime);

        String cacheKey = generateCacheKey("term:content", request.getTerm(),
                String.valueOf(request.getModuleId()), request.getContextTitle());

        // Check cache first
        TermContentResponseDto cachedResult = getCachedTermContent(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved term content from cache: {} (User: rebornstar1)", request.getTerm());
            return validateAndEnrichTermContent(cachedResult);
        }

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

            log.info("subModule is created {} (User: rebornstar1, Time: {})", subModule, currentTime);

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

                // Clear related caches
                clearTermRelatedCaches(moduleId, term);
            }

            // 5. Build and return the response with IDs included
            TermContentResponseDto result = TermContentResponseDto.builder()
                    .term(term)
                    .definition(definition)
                    .subModule(subModule)
                    .quiz(quiz)
                    .videoUrl(videoUrl)
                    .subModuleId(subModuleId) // Include submodule ID in response
                    .quizId(quizId) // Include quiz ID in response
                    .build();

            result = validateAndEnrichTermContent(result);

            // Cache the result
            cacheTermContent(cacheKey, result, TERM_CONTENT_TTL);

            logger.info("Generated and cached term content for: {} (User: rebornstar1)", term);
            return result;

        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error during parallel processing of term content: {} (User: rebornstar1)", e.getMessage());
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

        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Starting key terms extraction for concept: {}, module: {} (User: rebornstar1, Time: {})",
                conceptTitle, moduleTitle, currentTime);

        String cacheKey = generateCacheKey("keyterms:extract", conceptTitle, moduleTitle, String.valueOf(moduleId));

        // Check cache first
        KeyTermResponseDto cachedResult = getCachedKeyTerms(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved key terms from cache for concept: {} (User: rebornstar1)", conceptTitle);
            return validateAndEnrichKeyTerms(cachedResult);
        }

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

        response = validateAndEnrichKeyTerms(response);

        // Cache the result
        cacheKeyTerms(cacheKey, response, KEY_TERMS_TTL);

        logger.info("Extracted and cached {} key terms for concept: {} (User: rebornstar1)",
                keyTermsList.size(), conceptTitle);
        return response;
    }

    public QuizDto createTermQuiz(String term, String definition, String contextTitle) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Creating quiz for term: {} (User: rebornstar1, Time: {})", term, currentTime);

        String cacheKey = generateCacheKey("quiz:term", term, definition, contextTitle);

        // Check cache first
        QuizDto cachedResult = getCachedQuiz(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved quiz from cache for term: {} (User: rebornstar1)", term);
            return validateAndEnrichQuiz(cachedResult);
        }

        String safeTerm = sanitizeInput(term);
        String safeDefinition = sanitizeInput(definition);
        String safeContext = contextTitle != null ? sanitizeInput(contextTitle) : safeTerm.split(" ")[0];

        String quizPrompt = ModuleContentPrompts.createTermQuiPrompt(safeTerm, safeDefinition, safeContext);

        String quizJson = callGeminiForQuiz(quizPrompt);
        List<QuestionDto> questions = parseQuizQuestions(quizJson);

        QuizDto result = QuizDto.builder()
                .quizTitle(safeTerm + " Quiz")
                .description("Test your understanding of " + safeTerm)
                .difficulty("Intermediate")
                .timeLimit("5 minutes")
                .questions(questions)
                .passingScore(70)
                .build();

        result = validateAndEnrichQuiz(result);

        // Cache the result
        cacheQuiz(cacheKey, result, QUIZ_TTL);

        logger.info("Created and cached quiz for term: {} with {} questions (User: rebornstar1)",
                term, questions.size());
        return result;
    }

    public TermDetailResponseDto getTermDetailsWithProgress(Long userId, Long moduleId, Integer termIndex) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        log.info("Fetching term details for user {} module {} term {} (User: rebornstar1, Time: {})",
                userId, moduleId, termIndex, currentTime);

        String cacheKey = generateCacheKey("termdetails", String.valueOf(userId),
                String.valueOf(moduleId), String.valueOf(termIndex));

        // Check cache first (shorter TTL for user-specific data)
        TermDetailResponseDto cachedResult = getCachedTermDetails(cacheKey);
        if (cachedResult != null) {
            log.info("Retrieved term details from cache for user {} module {} term {} (User: rebornstar1)",
                    userId, moduleId, termIndex);
            return validateAndEnrichTermDetails(cachedResult);
        }

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
                    log.error("Error fetching video URL from term resources: {} (User: rebornstar1)", e.getMessage());
                }
            }
        }

        TermDetailResponseDto result = TermDetailResponseDto.builder()
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

        result = validateAndEnrichTermDetails(result);

        // Cache the result (shorter TTL for user-specific data)
        cacheTermDetails(cacheKey, result, TERM_DETAILS_TTL);

        log.info("Fetched and cached term details for user {} module {} term {} (User: rebornstar1)",
                userId, moduleId, termIndex);
        return result;
    }

    // Manual caching helper methods
    private String generateCacheKey(String prefix, String... parts) {
        return prefix + ":" + String.join(":", parts);
    }

    private TermContentResponseDto getCachedTermContent(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            return deserializeFromCache(cachedObject, TermContentResponseDto.class, cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached term content for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    private KeyTermResponseDto getCachedKeyTerms(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            return deserializeFromCache(cachedObject, KeyTermResponseDto.class, cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached key terms for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    private QuizDto getCachedQuiz(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            return deserializeFromCache(cachedObject, QuizDto.class, cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached quiz for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    private TermDetailResponseDto getCachedTermDetails(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            return deserializeFromCache(cachedObject, TermDetailResponseDto.class, cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached term details for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T deserializeFromCache(Object cachedObject, Class<T> targetClass, String cacheKey) throws Exception {
        if (targetClass.isInstance(cachedObject)) {
            logger.debug("Retrieved {} directly from cache: {} (User: rebornstar1)",
                    targetClass.getSimpleName(), cacheKey);
            return targetClass.cast(cachedObject);
        } else if (cachedObject instanceof String) {
            logger.debug("Deserializing {} from JSON string: {} (User: rebornstar1)",
                    targetClass.getSimpleName(), cacheKey);
            return objectMapper.readValue((String) cachedObject, targetClass);
        } else if (cachedObject instanceof Map) {
            logger.debug("Converting Map to {}: {} (User: rebornstar1)",
                    targetClass.getSimpleName(), cacheKey);
            String jsonString = objectMapper.writeValueAsString(cachedObject);
            return objectMapper.readValue(jsonString, targetClass);
        } else {
            logger.warn("Unexpected cached object type: {} for key: {} (User: rebornstar1)",
                    cachedObject.getClass(), cacheKey);
            throw new IllegalArgumentException("Unexpected cached object type");
        }
    }

    private void cacheTermContent(String cacheKey, TermContentResponseDto content, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, content, ttl, "term content");
        } catch (Exception e) {
            logger.warn("Failed to cache term content for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void cacheKeyTerms(String cacheKey, KeyTermResponseDto keyTerms, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, keyTerms, ttl, "key terms");
        } catch (Exception e) {
            logger.warn("Failed to cache key terms for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void cacheQuiz(String cacheKey, QuizDto quiz, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, quiz, ttl, "quiz");
        } catch (Exception e) {
            logger.warn("Failed to cache quiz for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void cacheTermDetails(String cacheKey, TermDetailResponseDto termDetails, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, termDetails, ttl, "term details");
        } catch (Exception e) {
            logger.warn("Failed to cache term details for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void validateAndCacheObject(String cacheKey, Object object, Duration ttl, String objectType)
            throws JsonProcessingException {
        // Validate the object before caching
        String jsonString = objectMapper.writeValueAsString(object);

        // Verify it can be deserialized back correctly
        Object testDeserialize = objectMapper.readValue(jsonString, object.getClass());

        if (testDeserialize != null) {
            cacheService.set(cacheKey, object, ttl);
            logger.debug("Successfully cached {} for key: {} (User: rebornstar1)", objectType, cacheKey);
        } else {
            logger.warn("{} failed validation, not caching: {} (User: rebornstar1)", objectType, cacheKey);
        }
    }

    private void clearTermRelatedCaches(Long moduleId, String term) {
        try {
            // Clear specific term content caches
            cacheService.deletePattern("term:content:*" + term + "*");

            // Clear quiz caches for this term
            cacheService.deletePattern("quiz:term:*" + term + "*");

            // Clear key terms caches for this module
            cacheService.deletePattern("keyterms:extract:*" + moduleId + "*");

            // Clear term details caches for this module
            cacheService.deletePattern("termdetails:*:" + moduleId + ":*");

            logger.info("Cleared term-related caches for module {} term {} (User: rebornstar1)", moduleId, term);
        } catch (Exception e) {
            logger.error("Error clearing term-related caches for module {} term {}: {} (User: rebornstar1)",
                    moduleId, term, e.getMessage());
        }
    }

    public void clearModuleContentCaches(Long moduleId) {
        try {
            cacheService.deletePattern("*:" + moduleId + ":*");
            cacheService.deletePattern("termdetails:*:" + moduleId + ":*");
            logger.info("Cleared all module content caches for module {} (User: rebornstar1, Time: {})",
                    moduleId, LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing module content caches for module {}: {} (User: rebornstar1)",
                    moduleId, e.getMessage());
        }
    }

    public void clearAllModuleContentCaches() {
        try {
            cacheService.deletePattern("term:*");
            cacheService.deletePattern("keyterms:*");
            cacheService.deletePattern("quiz:*");
            cacheService.deletePattern("termdetails:*");
            logger.info("Cleared all module content caches successfully (User: rebornstar1, Time: {})",
                    LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing all module content caches: {} (User: rebornstar1)", e.getMessage());
        }
    }

    private TermDetailResponseDto validateAndEnrichTermDetails(TermDetailResponseDto termDetails) {
        if (termDetails == null) {
            return null;
        }

        try {
            // Ensure non-null fields with proper defaults
            if (termDetails.getTerm() == null) {
                termDetails.setTerm("Unknown Term");
            }
            if (termDetails.getDefinition() == null) {
                termDetails.setDefinition("Definition not available");
            }

            // Validate nested objects
            if (termDetails.getArticle() != null) {
                termDetails.setArticle(validateAndEnrichSubModule(termDetails.getArticle()));
            }
            if (termDetails.getQuiz() != null) {
                termDetails.setQuiz(validateAndEnrichQuiz(termDetails.getQuiz()));
            }
            if (termDetails.getResourceProgress() != null) {
                termDetails.setResourceProgress(validateAndEnrichResourceProgress(termDetails.getResourceProgress()));
            }

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(termDetails);
            TermDetailResponseDto validated = objectMapper.readValue(jsonString, TermDetailResponseDto.class);

            logger.debug("Term details validation successful for: {} at {} (User: rebornstar1)",
                    termDetails.getTerm(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich term details: {} at {} (User: rebornstar1)",
                    e.getMessage(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return termDetails;
        }
    }

    private TermResourceProgressDto validateAndEnrichResourceProgress(TermResourceProgressDto progress) {
        if (progress == null) {
            return TermResourceProgressDto.builder()
                    .articleAvailable(false)
                    .articleStarted(false)
                    .articleCompleted(false)
                    .articleProgress(0)
                    .quizAvailable(false)
                    .quizStarted(false)
                    .quizCompleted(false)
                    .quizScore(0)
                    .videoAvailable(false)
                    .videoStarted(false)
                    .videoCompleted(false)
                    .videoProgress(0)
                    .build();
        }

        // Ensure all primitive fields have valid defaults
        if (progress.getArticleProgress() == null) {
            progress.setArticleProgress(0);
        }
        if (progress.getQuizScore() == null) {
            progress.setQuizScore(0);
        }
        if (progress.getVideoProgress() == null) {
            progress.setVideoProgress(0);
        }

        return progress;
    }

    private QuizDto validateAndEnrichQuiz(QuizDto quiz) {
        if (quiz == null) {
            return null;
        }

        try {
            // Ensure non-null fields with proper validation
            if (quiz.getQuizTitle() == null || quiz.getQuizTitle().trim().isEmpty()) {
                quiz.setQuizTitle("Quiz");
            }
            if (quiz.getDescription() == null || quiz.getDescription().trim().isEmpty()) {
                quiz.setDescription("Test your knowledge");
            }
            if (quiz.getDifficulty() == null || quiz.getDifficulty().trim().isEmpty()) {
                quiz.setDifficulty("Intermediate");
            }
            if (quiz.getTimeLimit() == null || quiz.getTimeLimit().trim().isEmpty()) {
                quiz.setTimeLimit("5 minutes");
            }
            if (quiz.getQuestions() == null) {
                quiz.setQuestions(new ArrayList<>());
            }

            // Validate questions and remove null entries
            quiz.getQuestions().removeIf(Objects::isNull);

            // Ensure each question is valid
            quiz.setQuestions(quiz.getQuestions().stream()
                    .map(this::validateQuestion)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(quiz);
            QuizDto validated = objectMapper.readValue(jsonString, QuizDto.class);

            logger.debug("Quiz validation successful: {} at {} (User: rebornstar1)",
                    quiz.getQuizTitle(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich quiz: {} at {} (User: rebornstar1)",
                    e.getMessage(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return quiz;
        }
    }

    private QuestionDto validateQuestion(QuestionDto question) {
        if (question == null) {
            return null;
        }

        if (question.getQuestion() == null || question.getQuestion().trim().isEmpty()) {
            question.setQuestion("Sample question");
        }
        if (question.getOptions() == null) {
            question.setOptions(Arrays.asList("A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"));
        }
        if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
            question.setCorrectAnswer("A");
        }
        if (question.getExplanation() == null || question.getExplanation().trim().isEmpty()) {
            question.setExplanation("Explanation not available");
        }

        // Remove null options
        question.getOptions().removeIf(Objects::isNull);

        return question;
    }

    private SubModuleDto validateAndEnrichSubModule(SubModuleDto subModule) {
        if (subModule == null) {
            return null;
        }

        try {
            // Ensure non-null fields with proper validation
            if (subModule.getSubModuleTitle() == null || subModule.getSubModuleTitle().trim().isEmpty()) {
                subModule.setSubModuleTitle("Untitled SubModule");
            }
            if (subModule.getArticle() == null || subModule.getArticle().trim().isEmpty()) {
                subModule.setArticle("Content not available");
            }
            if (subModule.getReadingTime() == null || subModule.getReadingTime().trim().isEmpty()) {
                subModule.setReadingTime("5 minutes");
            }
            if (subModule.getTags() == null) {
                subModule.setTags(new ArrayList<>());
            }
            if (subModule.getKeywords() == null) {
                subModule.setKeywords(new ArrayList<>());
            }

            // Remove null entries from lists
            subModule.getTags().removeIf(Objects::isNull);
            subModule.getKeywords().removeIf(Objects::isNull);

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(subModule);
            SubModuleDto validated = objectMapper.readValue(jsonString, SubModuleDto.class);

            logger.debug("SubModule validation successful: {} at {} (User: rebornstar1)",
                    subModule.getSubModuleTitle(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich submodule: {} at {} (User: rebornstar1)",
                    e.getMessage(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return subModule;
        }
    }

    // Validation and enrichment methods
    private TermContentResponseDto validateAndEnrichTermContent(TermContentResponseDto content) {
        if (content == null) {
            return null;
        }

        try {
            // Validate and ensure non-null fields
            if (content.getTerm() == null) {
                content.setTerm("Unknown Term");
            }
            if (content.getDefinition() == null) {
                content.setDefinition("Definition not available");
            }

            // Validate submodule
            if (content.getSubModule() != null) {
                content.setSubModule(validateAndEnrichSubModule(content.getSubModule()));
            }

            // Validate quiz
            if (content.getQuiz() != null) {
                content.setQuiz(validateAndEnrichQuiz(content.getQuiz()));
            }

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(content);
            TermContentResponseDto validated = objectMapper.readValue(jsonString, TermContentResponseDto.class);

            logger.debug("Term content validation successful for: {} (User: rebornstar1)", content.getTerm());
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich term content: {} (User: rebornstar1)", e.getMessage());
            return content;
        }
    }

    private KeyTermResponseDto validateAndEnrichKeyTerms(KeyTermResponseDto keyTerms) {
        if (keyTerms == null) {
            return null;
        }

        try {
            // Ensure non-null fields
            if (keyTerms.getKeyTerms() == null) {
                keyTerms.setKeyTerms(new ArrayList<>());
            }
            if (keyTerms.getConceptTitle() == null) {
                keyTerms.setConceptTitle("Unknown Concept");
            }
            if (keyTerms.getModuleTitle() == null) {
                keyTerms.setModuleTitle("Unknown Module");
            }

            // Validate each key term
            keyTerms.getKeyTerms().removeIf(Objects::isNull);

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(keyTerms);
            KeyTermResponseDto validated = objectMapper.readValue(jsonString, KeyTermResponseDto.class);

            logger.debug("Key terms validation successful for: {} (User: rebornstar1)", keyTerms.getConceptTitle());
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich key terms: {} (User: rebornstar1)", e.getMessage());
            return keyTerms;
        }
    }
    // ALL YOUR EXISTING PRIVATE METHODS REMAIN THE SAME...
    // (callGeminiForQuiz, cleanAndRepairJson, generateFallbackQuizJson, analyzeTopicAndExtractKeyTerms, etc.)

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

            logger.info("Calling Gemini API for quiz generation... (User: rebornstar1)");
            String rawResponse = geminiWebClient.post()
                    .uri("")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {} (User: rebornstar1)", rawResponse);
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
                logger.warn("Gemini API returned empty text content (User: rebornstar1)");
                return generateFallbackQuizJson();
            }

            generatedText = generatedText.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            try {
                objectMapper.readTree(generatedText);
                return generatedText;
            } catch (Exception e) {
                logger.warn("Generated text is not valid JSON: {} (User: rebornstar1)", e.getMessage());
                return cleanAndRepairJson(generatedText);
            }

        } catch (Exception e) {
            logger.error("Error calling Gemini API for quiz: {} (User: rebornstar1)", e.getMessage());
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
            logger.error("Failed to repair JSON: {} (User: rebornstar1)", e.getMessage());
            return generateFallbackQuizJson();
        }
    }

    private String generateFallbackQuizJson() {
        return ModuleContentFallback.FallBackQuizJson();
    }

    public Map<String, String> analyzeTopicAndExtractKeyTerms(String conceptTitle, String moduleTitle) {
        logger.info("Analyzing topic complexity and extracting key terms for: {} (User: rebornstar1)", conceptTitle);

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

                logger.info("Extracted {} key terms for topic: {} (User: rebornstar1)", keyTerms.size(), conceptTitle);
            } else {
                throw new Exception("Could not find valid JSON object in response");
            }
        } catch (Exception e) {
            logger.error("Error parsing key terms JSON: {} (User: rebornstar1)", e.getMessage());
            logger.debug("Raw response from Gemini API: {} (User: rebornstar1)", analysisResult);

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

        logger.info("Creating submodule for term: {} in context: {} (User: rebornstar1)", term, context);

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
        logger.info("Searching for definition videos for term: {} (User: rebornstar1)", term);

        String cacheKey = generateCacheKey("videos:definition", term, definition);

        // Check cache first
        List<String> cachedVideos = getCachedVideoUrls(cacheKey);
        if (cachedVideos != null) {
            logger.info("Retrieved {} videos from cache for term: {} (User: rebornstar1)", cachedVideos.size(), term);
            return cachedVideos;
        }

        String searchQuery = term + " " + definition;
        List<String> videos = findRelevantYouTubeVideos(searchQuery, 1);

        // Cache the result
        cacheVideoUrls(cacheKey, videos, VIDEO_URLS_TTL);

        return videos;
    }

    @SuppressWarnings("unchecked")
    private List<String> getCachedVideoUrls(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            if (cachedObject instanceof List) {
                return (List<String>) cachedObject;
            } else if (cachedObject instanceof String) {
                return objectMapper.readValue((String) cachedObject, List.class);
            }

            return null;
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached video URLs for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    private void cacheVideoUrls(String cacheKey, List<String> videos, Duration ttl) {
        try {
            cacheService.set(cacheKey, videos, ttl);
            logger.debug("Successfully cached {} video URLs for key: {} (User: rebornstar1)", videos.size(), cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to cache video URLs for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
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
                logger.warn("YouTube API returned null response for searchQuery: {} (User: rebornstar1)", searchQuery);
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
                logger.warn("No video results found for topic: {} (User: rebornstar1)", topic);
            }
        } catch (Exception e) {
            logger.error("Error calling YouTube Data API: {} (User: rebornstar1)", e.getMessage(), e);
        }
        return videoUrls;
    }

    // Include all your existing conversion and helper methods...
    // (convertToQuiz, convertToQuizDto, convertToSubModule, convertToSubModuleDto, parseQuizQuestions, etc.)

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
                logger.warn("Questions node is not an array. Using fallback questions. (User: rebornstar1)");
                return createFallbackQuestions();
            }

            for (JsonNode questionNode : questionsNode) {
                try {
                    String questionText = questionNode.has("question") ?
                            questionNode.get("question").asText() : null;

                    if (questionText == null || questionText.trim().isEmpty()) {
                        logger.warn("Question text is missing or empty, skipping (User: rebornstar1)");
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
                        logger.warn("No options found for question: {} (User: rebornstar1)", questionText);
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
                    logger.warn("Error processing individual question: {} (User: rebornstar1)", e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing quiz JSON: {} (User: rebornstar1)", e.getMessage());
        }

        if (questions.isEmpty()) {
            logger.warn("No valid questions were parsed. Using fallback questions. (User: rebornstar1)");
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

    // Continue with all your remaining existing methods...
    // (cleanJsonString, extractSingleQuestion, extractStringValue, extractOptions, createDefaultQuestion, sanitizeInput, callGeminiApi, etc.)

    private String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ")
                .trim();
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
            String rawResponse = geminiWebClient.post()
                    .uri("") // URL is already set in the WebClient bean
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {} (User: rebornstar1)", rawResponse);
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
                logger.warn("Gemini API returned empty text content (User: rebornstar1)");
                return "Content generation failed. Please try again.";
            }

            generatedText = generatedText.replaceAll("```markdown", "")
                    .replaceAll("```", "")
                    .trim();

            return generatedText;

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {} (User: rebornstar1)", e.getMessage(), e);
            throw new RuntimeException("Failed to generate content from Gemini API", e);
        }
    }

    // Include all remaining methods: getTermResourceProgress, generateTermResourcesIfNeeded, createStepProgressForTermResources, extractVideoId
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
            log.error("Error retrieving term progress: {} (User: rebornstar1)", e.getMessage());
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
                            userId, moduleId, UserModuleStepProgress.StepType.QUIZ,progress.getQuizId())
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
                log.error("Error retrieving step progress: {} (User: rebornstar1)", e.getMessage());
            }
        }

        return progress;
    }

    @Transactional
    public void generateTermResourcesIfNeeded(Long userId, Long moduleId, Integer termIndex,
                                              String term, String definition) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        log.info("Checking if term resources need to be generated for term {} (User: rebornstar1, Time: {})",
                termIndex, currentTime);

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
            log.error("Error checking existing term resources: {} (User: rebornstar1)", e.getMessage());
        }

        if (!resourcesExist) {
            log.info("Generating resources for term {}: {} (User: rebornstar1)", termIndex, term);

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

            // Clear term details cache since we've updated resources
            clearTermDetailsCacheForUser(userId, moduleId, termIndex);
        }
    }

    private void createStepProgressForTermResources(Long userId, Long moduleId, Integer termIndex,
                                                    TermContentResponseDto resources) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
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

            log.info("Created step progress entries for term {} (User: rebornstar1, Time: {})",
                    termIndex, currentTime);
        } catch (Exception e) {
            log.error("Error creating step progress entries: {} (User: rebornstar1)", e.getMessage());
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
            log.warn("Could not extract video ID from URL: {} (User: rebornstar1)", videoUrl);
        }

        return videoUrl;
    }

    // Additional helper methods for parsing and validation
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

        logger.debug("Cleaned JSON: {} (User: rebornstar1)", cleaned);
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
            logger.warn("Error extracting question: {} (User: rebornstar1)", e.getMessage());
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

    // Additional cache management methods
    private void clearTermDetailsCacheForUser(Long userId, Long moduleId, Integer termIndex) {
        try {
            String cacheKey = generateCacheKey("termdetails", String.valueOf(userId),
                    String.valueOf(moduleId), String.valueOf(termIndex));
            cacheService.delete(cacheKey);

            logger.debug("Cleared term details cache for user {} module {} term {} (User: rebornstar1)",
                    userId, moduleId, termIndex);
        } catch (Exception e) {
            logger.error("Error clearing term details cache for user {} module {} term {}: {} (User: rebornstar1)",
                    userId, moduleId, termIndex, e.getMessage());
        }
    }

    public void clearUserProgressCaches(Long userId, Long moduleId) {
        try {
            cacheService.deletePattern("termdetails:" + userId + ":" + moduleId + ":*");
            logger.info("Cleared user progress caches for user {} module {} (User: rebornstar1, Time: {})",
                    userId, moduleId, LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing user progress caches for user {} module {}: {} (User: rebornstar1)",
                    userId, moduleId, e.getMessage());
        }
    }

    public void clearUserCaches(Long userId) {
        try {
            cacheService.deletePattern("termdetails:" + userId + ":*");
            logger.info("Cleared all user caches for user {} (User: rebornstar1, Time: {})",
                    userId, LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing user caches for user {}: {} (User: rebornstar1)",
                    userId, e.getMessage());
        }
    }

    // Performance monitoring methods
    public void logCacheStats() {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("ModuleContentService cache performance stats logged (User: rebornstar1, Time: {})",
                currentTime);
        // Implementation would depend on your CacheService capabilities
    }

    // Shutdown method for cleanup
    public void cleanupResources() {
        try {
            if (executorService != null && !executorService.isShutdown()) {
                executorService.shutdown();
                logger.info("ExecutorService shutdown completed (User: rebornstar1, Time: {})",
                        LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            }
        } catch (Exception e) {
            logger.error("Error during resource cleanup: {} (User: rebornstar1)", e.getMessage());
        }
    }
}