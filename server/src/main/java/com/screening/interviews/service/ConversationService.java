package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.community.ConversationDTO;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Conversation;
import com.screening.interviews.model.Thread;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.ConversationRepository;
import com.screening.interviews.repo.ThreadRepository;
import com.screening.interviews.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private static final Logger logger = LoggerFactory.getLogger(ConversationService.class);
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ConversationRepository conversationRepository;
    private final ThreadRepository threadRepository;
    private final UserRepository userRepository;
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    // Cache TTL configurations
    private static final Duration CONVERSATION_TTL = Duration.ofMinutes(30);
    private static final Duration CONVERSATION_LIST_TTL = Duration.ofMinutes(15);
    private static final Duration THREAD_CONVERSATIONS_TTL = Duration.ofMinutes(20);
    private static final Duration USER_CONVERSATIONS_TTL = Duration.ofMinutes(25);

    // Get all conversations in a thread
    public List<ConversationDTO> getConversationsByThreadId(Long threadId) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Fetching conversations for thread ID: {} (User: rebornstar1, Time: {})",
                threadId, currentTime);

        String cacheKey = generateCacheKey("conversations:thread", String.valueOf(threadId));

        // Check cache first
        List<ConversationDTO> cachedResult = getCachedConversationList(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved {} conversations from cache for thread {} (User: rebornstar1)",
                    cachedResult.size(), threadId);
            return cachedResult.stream()
                    .map(this::validateAndEnrichConversation)
                    .collect(Collectors.toList());
        }

        List<Conversation> conversations = conversationRepository.findByThreadId(threadId);
        List<ConversationDTO> result = conversations.stream()
                .map(this::convertToDTO)
                .map(this::validateAndEnrichConversation)
                .collect(Collectors.toList());

        // Cache the result
        cacheConversationList(cacheKey, result, THREAD_CONVERSATIONS_TTL);

        logger.info("Fetched {} conversations for thread {} from database and cached (User: rebornstar1)",
                result.size(), threadId);
        return result;
    }

    // Get conversation by ID
    public ConversationDTO getConversationById(Long id) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Fetching conversation by ID: {} (User: rebornstar1, Time: {})", id, currentTime);

        String cacheKey = generateCacheKey("conversation:single", String.valueOf(id));

        // Check cache first
        ConversationDTO cachedResult = getCachedConversation(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved conversation {} from cache (User: rebornstar1)", id);
            return validateAndEnrichConversation(cachedResult);
        }

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        ConversationDTO result = convertToDTO(conversation);
        result = validateAndEnrichConversation(result);

        // Cache the result
        cacheConversation(cacheKey, result, CONVERSATION_TTL);

        logger.info("Fetched conversation {} from database and cached (User: rebornstar1)", id);
        return result;
    }

    // Create a new conversation
    @Transactional
    public ConversationDTO createConversation(ConversationDTO conversationDTO) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Creating new conversation: {} (User: rebornstar1, Time: {})",
                conversationDTO.getTitle(), currentTime);

        // Validate and enrich the input
        conversationDTO = validateAndEnrichConversation(conversationDTO);

        Conversation conversation = convertToEntity(conversationDTO);
        Conversation savedConversation = conversationRepository.save(conversation);

        ConversationDTO result = convertToDTO(savedConversation);
        result = validateAndEnrichConversation(result);

        // Clear related caches and cache the new conversation
        clearConversationRelatedCaches(savedConversation.getId(), savedConversation.getThread().getId());

        String cacheKey = generateCacheKey("conversation:single", String.valueOf(savedConversation.getId()));
        cacheConversation(cacheKey, result, CONVERSATION_TTL);

        logger.info("Created conversation with ID {} and cached (User: rebornstar1)", savedConversation.getId());
        return result;
    }

    // Update a conversation
    @Transactional
    public ConversationDTO updateConversation(Long id, ConversationDTO conversationDTO) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Updating conversation ID: {} (User: rebornstar1, Time: {})", id, currentTime);

        Conversation existingConversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        // Validate and enrich the input
        conversationDTO = validateAndEnrichConversation(conversationDTO);

        existingConversation.setTitle(conversationDTO.getTitle());
        existingConversation.setLastActivityAt(LocalDateTime.now());

        // Update concept tags
        if (conversationDTO.getConceptTags() != null) {
            existingConversation.setConceptTags(conversationDTO.getConceptTags());
        }

        Conversation updatedConversation = conversationRepository.save(existingConversation);
        ConversationDTO result = convertToDTO(updatedConversation);
        result = validateAndEnrichConversation(result);

        // Clear related caches and update cache with new data
        clearConversationRelatedCaches(id, updatedConversation.getThread().getId());

        String cacheKey = generateCacheKey("conversation:single", String.valueOf(id));
        cacheConversation(cacheKey, result, CONVERSATION_TTL);

        logger.info("Updated conversation {} and refreshed cache (User: rebornstar1)", id);
        return result;
    }

    // Delete a conversation
    @Transactional
    public void deleteConversation(Long id) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Deleting conversation ID: {} (User: rebornstar1, Time: {})", id, currentTime);

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        Long threadId = conversation.getThread().getId();

        conversationRepository.delete(conversation);

        // Clear related caches
        clearConversationRelatedCaches(id, threadId);

        logger.info("Deleted conversation {} and cleared related caches (User: rebornstar1)", id);
    }

    // Add participant to conversation
    @Transactional
    public void addParticipantToConversation(Long conversationId, Long userId) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Adding participant {} to conversation {} (User: rebornstar1, Time: {})",
                userId, conversationId, currentTime);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        conversation.addParticipant(user);
        conversation.updateLastActivity();
        conversationRepository.save(conversation);

        // Clear related caches
        clearConversationRelatedCaches(conversationId, conversation.getThread().getId());
        clearUserConversationCaches(userId);

        logger.info("Added participant {} to conversation {} and cleared caches (User: rebornstar1)",
                userId, conversationId);
    }

    // Remove participant from conversation
    @Transactional
    public void removeParticipantFromConversation(Long conversationId, Long userId) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Removing participant {} from conversation {} (User: rebornstar1, Time: {})",
                userId, conversationId, currentTime);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        conversation.removeParticipant(user);
        conversationRepository.save(conversation);

        // Clear related caches
        clearConversationRelatedCaches(conversationId, conversation.getThread().getId());
        clearUserConversationCaches(userId);

        logger.info("Removed participant {} from conversation {} and cleared caches (User: rebornstar1)",
                userId, conversationId);
    }

    // Get conversations by participant
    public List<ConversationDTO> getConversationsByParticipantId(Long userId) {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("Fetching conversations for participant ID: {} (User: rebornstar1, Time: {})",
                userId, currentTime);

        String cacheKey = generateCacheKey("conversations:participant", String.valueOf(userId));

        // Check cache first
        List<ConversationDTO> cachedResult = getCachedConversationList(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved {} conversations from cache for participant {} (User: rebornstar1)",
                    cachedResult.size(), userId);
            return cachedResult.stream()
                    .map(this::validateAndEnrichConversation)
                    .collect(Collectors.toList());
        }

        List<Conversation> conversations = conversationRepository.findByParticipantId(userId);
        List<ConversationDTO> result = conversations.stream()
                .map(this::convertToDTO)
                .map(this::validateAndEnrichConversation)
                .collect(Collectors.toList());

        // Cache the result
        cacheConversationList(cacheKey, result, USER_CONVERSATIONS_TTL);

        logger.info("Fetched {} conversations for participant {} from database and cached (User: rebornstar1)",
                result.size(), userId);
        return result;
    }

    // Manual caching helper methods
    private String generateCacheKey(String prefix, String... parts) {
        return prefix + ":" + String.join(":", parts);
    }

    private ConversationDTO getCachedConversation(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            return deserializeFromCache(cachedObject, ConversationDTO.class, cacheKey);
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached conversation for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<ConversationDTO> getCachedConversationList(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            if (cachedObject instanceof List) {
                List<?> cachedList = (List<?>) cachedObject;
                return cachedList.stream()
                        .map(item -> {
                            try {
                                if (item instanceof ConversationDTO) {
                                    return (ConversationDTO) item;
                                } else if (item instanceof Map) {
                                    String jsonString = objectMapper.writeValueAsString(item);
                                    return objectMapper.readValue(jsonString, ConversationDTO.class);
                                } else {
                                    return null;
                                }
                            } catch (Exception e) {
                                logger.warn("Failed to convert list item: {} (User: rebornstar1)", e.getMessage());
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            } else {
                logger.warn("Unexpected cached list type: {} for key: {} (User: rebornstar1)",
                        cachedObject.getClass(), cacheKey);
                cacheService.delete(cacheKey);
                return null;
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve cached conversation list for key: {}, error: {} (User: rebornstar1)",
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

    private void cacheConversation(String cacheKey, ConversationDTO conversation, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, conversation, ttl, "conversation");
        } catch (Exception e) {
            logger.warn("Failed to cache conversation for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void cacheConversationList(String cacheKey, List<ConversationDTO> conversations, Duration ttl) {
        try {
            validateAndCacheObject(cacheKey, conversations, ttl, "conversation list");
        } catch (Exception e) {
            logger.warn("Failed to cache conversation list for key: {}: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
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

    private void clearConversationRelatedCaches(Long conversationId, Long threadId) {
        try {
            // Clear specific conversation cache
            String specificConversationKey = generateCacheKey("conversation:single", String.valueOf(conversationId));
            cacheService.delete(specificConversationKey);

            // Clear thread conversations cache
            String threadConversationsKey = generateCacheKey("conversations:thread", String.valueOf(threadId));
            cacheService.delete(threadConversationsKey);

            logger.info("Cleared conversation-related caches for conversation {} thread {} (User: rebornstar1)",
                    conversationId, threadId);
        } catch (Exception e) {
            logger.error("Error clearing conversation-related caches for conversation {} thread {}: {} (User: rebornstar1)",
                    conversationId, threadId, e.getMessage());
        }
    }

    private void clearUserConversationCaches(Long userId) {
        try {
            String userConversationsKey = generateCacheKey("conversations:participant", String.valueOf(userId));
            cacheService.delete(userConversationsKey);

            logger.info("Cleared user conversation caches for user {} (User: rebornstar1)", userId);
        } catch (Exception e) {
            logger.error("Error clearing user conversation caches for user {}: {} (User: rebornstar1)",
                    userId, e.getMessage());
        }
    }

    // Clear all conversation caches
    public void clearAllConversationCaches() {
        try {
            cacheService.deletePattern("conversation:*");
            cacheService.deletePattern("conversations:*");
            logger.info("Cleared all conversation caches successfully (User: rebornstar1, Time: {})",
                    LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing all conversation caches: {} (User: rebornstar1)", e.getMessage());
        }
    }

    public void clearConversationCachesByThreadId(Long threadId) {
        try {
            String threadConversationsKey = generateCacheKey("conversations:thread", String.valueOf(threadId));
            cacheService.delete(threadConversationsKey);
            logger.info("Cleared conversation caches for thread {} (User: rebornstar1)", threadId);
        } catch (Exception e) {
            logger.error("Error clearing conversation caches for thread {}: {} (User: rebornstar1)",
                    threadId, e.getMessage());
        }
    }

    // Validation and enrichment methods
    private ConversationDTO validateAndEnrichConversation(ConversationDTO conversation) {
        if (conversation == null) {
            return null;
        }

        try {
            // Ensure non-null fields with proper defaults
            if (conversation.getTitle() == null || conversation.getTitle().trim().isEmpty()) {
                conversation.setTitle("Untitled Conversation");
            }
            if (conversation.getParticipantIds() == null) {
                conversation.setParticipantIds(new ArrayList<>());
            }
            if (conversation.getConceptTags() == null) {
                conversation.setConceptTags(new ArrayList<>());
            }
            if (conversation.getStartedAt() == null) {
                conversation.setStartedAt(LocalDateTime.now());
            }
            if (conversation.getLastActivityAt() == null) {
                conversation.setLastActivityAt(LocalDateTime.now());
            }

            // Remove null entries from lists
            conversation.getParticipantIds().removeIf(Objects::isNull);
            conversation.getConceptTags().removeIf(Objects::isNull);

            // Test JSON serialization
            String jsonString = objectMapper.writeValueAsString(conversation);
            ConversationDTO validated = objectMapper.readValue(jsonString, ConversationDTO.class);

            logger.debug("Conversation validation successful for: {} at {} (User: rebornstar1)",
                    conversation.getTitle(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich conversation: {} at {} (User: rebornstar1)",
                    e.getMessage(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));
            return conversation;
        }
    }

    // Helper methods for DTO conversion (enhanced with validation)
    private ConversationDTO convertToDTO(Conversation conversation) {
        ConversationDTO dto = ConversationDTO.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .threadId(conversation.getThread() != null ? conversation.getThread().getId() : null)
                .startedAt(conversation.getStartedAt())
                .lastActivityAt(conversation.getLastActivityAt())
                .participantIds(conversation.getParticipants() != null ?
                        conversation.getParticipants().stream()
                                .map(User::getId)
                                .collect(Collectors.toList()) : new ArrayList<>())
                .conceptTags(conversation.getConceptTags() != null ?
                        conversation.getConceptTags() : new ArrayList<>())
                .build();

        return dto;
    }

    private Conversation convertToEntity(ConversationDTO dto) {
        Conversation conversation = new Conversation();
        conversation.setTitle(dto.getTitle());

        if (dto.getThreadId() != null) {
            Thread thread = threadRepository.findById(dto.getThreadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + dto.getThreadId()));
            conversation.setThread(thread);
        }

        if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
            for (Long userId : dto.getParticipantIds()) {
                if (userId != null) {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                    conversation.addParticipant(user);
                }
            }
        }

        if (dto.getConceptTags() != null) {
            conversation.setConceptTags(dto.getConceptTags().stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }

        return conversation;
    }

    // Performance monitoring
    public void logCacheStats() {
        String currentTime = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        logger.info("ConversationService cache performance stats logged (User: rebornstar1, Time: {})",
                currentTime);
    }
}