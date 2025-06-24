package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.community.MessageDTO;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Conversation;
import com.screening.interviews.model.Message;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.ConversationRepository;
import com.screening.interviews.repo.MessageRepository;
import com.screening.interviews.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    private final ConversationRepository conversationRepository;

    private final UserRepository userRepository;

    private final ObjectMapper objectMapper;

    private final CacheService cacheService;

    // Get all messages in a conversation
    @Cacheable(value = "messages", key = "'conversation:' + #conversationId + ':all'",
            unless = "#result == null || #result.isEmpty()")
    public List<MessageDTO> getMessagesByConversationId(Long conversationId) {
        return messageRepository.findByConversationIdOrderByTimestamp(conversationId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    @Cacheable(value = "messages", key = "'conversation:' + #conversationId + ':top-level'",
            unless = "#result == null || #result.isEmpty()")
    public List<MessageDTO> getTopLevelMessagesByConversationId(Long conversationId) {
        return messageRepository.findByConversationIdAndReplyToMessageIsNullOrderByTimestamp(conversationId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "messages", key = "'conversation:' + #conversationId + ':threaded'",
            unless = "#result == null || #result.isEmpty()")
    public List<MessageDTO> getThreadedMessagesByConversationId(Long conversationId) {
        // First, get all messages for the conversation
        List<Message> allMessages = messageRepository.findByConversationIdOrderByTimestamp(conversationId);

        // Separate top-level messages
        List<Message> topLevelMessages = allMessages.stream()
                .filter(msg -> msg.getReplyToMessage() == null)
                .toList();

        // Create a map of parent message ID to list of replies
        Map<Long, List<Message>> repliesMap = allMessages.stream()
                .filter(msg -> msg.getReplyToMessage() != null)
                .collect(Collectors.groupingBy(msg -> msg.getReplyToMessage().getId()));

        // Convert to DTOs with replies
        return topLevelMessages.stream()
                .map(msg -> convertToDTOWithReplies(msg, repliesMap))
                .collect(Collectors.toList());
    }


    @Cacheable(value = "messages", key = "#id", unless = "#result == null")
    public MessageDTO getMessageById(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        return convertToDTO(message);
    }

    // Create a new message
    @Transactional
    @Caching(
            evict = {
                    @CacheEvict(value = "messages", key = "'conversation:' + #messageDTO.conversationId + ':all'"),
                    @CacheEvict(value = "messages", key = "'conversation:' + #messageDTO.conversationId + ':top-level'"),
                    @CacheEvict(value = "messages", key = "'conversation:' + #messageDTO.conversationId + ':threaded'")
            }
    )
    public MessageDTO createMessage(MessageDTO messageDTO) {
        // Validate required fields
        if (messageDTO.getMessageType() == null) {
            throw new IllegalArgumentException("Message type must not be null");
        }

        Message message = convertToEntity(messageDTO);
        Message savedMessage = messageRepository.save(message);
        MessageDTO result = convertToDTO(savedMessage);

        // Cache the individual message
        String messageKey = "messages:" + savedMessage.getId();
        cacheService.set(messageKey, result, Duration.ofMinutes(5));

        return result;
    }

    // Update a message
    @Transactional
    @Caching(
            put = @CachePut(value = "messages", key = "#id"),
            evict = {
                    @CacheEvict(value = "messages", key = "'conversation:*'", allEntries = true)
            }
    )
    public MessageDTO updateMessage(Long id, MessageDTO messageDTO) {
        Message existingMessage = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));

        // Update fields
        existingMessage.setContent(messageDTO.getContent());
        existingMessage.setConceptTags(messageDTO.getConceptTags());

        Message updatedMessage = messageRepository.save(existingMessage);
        return convertToDTO(updatedMessage);
    }


    @Transactional
    @Caching(
            evict = {
                    @CacheEvict(value = "messages", key = "#id"),
                    @CacheEvict(value = "messages", key = "'conversation:*'", allEntries = true)
            }
    )
    public void deleteMessage(Long id) {
        messageRepository.deleteById(id);
    }


    public void clearMessageCaches(Long conversationId) {
        cacheService.delete("messages:conversation:" + conversationId + ":all");
        cacheService.delete("messages:conversation:" + conversationId + ":top-level");
        cacheService.delete("messages:conversation:" + conversationId + ":threaded");
    }

    public void clearAllMessageCaches() {
        cacheService.deletePattern("messages:*");
    }

    private MessageDTO convertToDTOWithReplies(Message message, Map<Long, List<Message>> repliesMap) {
        MessageDTO dto = convertToDTO(message);

        // Add replies if any exist
        List<Message> replies = repliesMap.getOrDefault(message.getId(), new ArrayList<>());
        if (!replies.isEmpty()) {
            dto.setReplies(replies.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }


    // Helper methods for DTO conversion
    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setUserId(message.getUser().getId());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType());
        dto.setTimestamp(message.getTimestamp());
        dto.setConceptTags(message.getConceptTags());

        // Determine if this is a top-level message or a reply
        if (message.getReplyToMessage() != null) {
            dto.setReplyToMessageId(message.getReplyToMessage().getId());
            dto.setTopLevelMessage(false);
        } else {
            dto.setReplyToMessageId(null);
            dto.setTopLevelMessage(true);
        }

        return dto;
    }

    private Message convertToEntity(MessageDTO dto) {
        Message message = new Message();

        Conversation conversation = conversationRepository.findById(dto.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + dto.getConversationId()));
        message.setConversation(conversation);

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        message.setUser(user);

        // Convert any JSON objects to string if needed
        if (dto.getContent() != null && !(dto.getContent() instanceof String)) {
            try {
                message.setContent(objectMapper.writeValueAsString(dto.getContent()));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to convert content to string: " + e.getMessage());
            }
        } else {
            message.setContent(dto.getContent());
        }

        message.setMessageType(dto.getMessageType());

        if (dto.getTimestamp() != null) {
            message.setTimestamp(dto.getTimestamp());
        } else {
            message.setTimestamp(LocalDateTime.now());
        }

        if (dto.getConceptTags() != null) {
            message.setConceptTags(dto.getConceptTags());
        }

        // Handle reply logic
        if (dto.getReplyToMessageId() != null) {
            messageRepository.findById(dto.getReplyToMessageId())
                    .ifPresent(message::setReplyToMessage);
        } else {
            // Explicitly set to null for top-level messages
            message.setReplyToMessage(null);
        }

        return message;
    }
}