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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // Get all messages in a conversation
    public List<MessageDTO> getMessagesByConversationId(Long conversationId) {
        return messageRepository.findByConversationIdOrderByTimestamp(conversationId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get only top-level messages in a conversation
    public List<MessageDTO> getTopLevelMessagesByConversationId(Long conversationId) {
        return messageRepository.findByConversationIdAndReplyToMessageIsNullOrderByTimestamp(conversationId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get top-level messages with their replies
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

    // Helper method to convert a message to DTO with its replies
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

    // Get message by ID
    public MessageDTO getMessageById(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        return convertToDTO(message);
    }

    // Create a new message
    @Transactional
    public MessageDTO createMessage(MessageDTO messageDTO) {
        // Validate required fields
        if (messageDTO.getMessageType() == null) {
            throw new IllegalArgumentException("Message type must not be null");
        }

        if (messageDTO.getContent() == null) {
            throw new IllegalArgumentException("Content must not be null");
        }

        // Convert any JSON objects to string if needed
        if (!(messageDTO.getContent() instanceof String)) {
            try {
                messageDTO.setContent(objectMapper.writeValueAsString(messageDTO.getContent()));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Failed to convert content to string: " + e.getMessage());
            }
        }

        Message message = convertToEntity(messageDTO);

        // Update conversation's last activity time
        Conversation conversation = message.getConversation();
        conversation.updateLastActivity();
        conversationRepository.save(conversation);

        // Add sender as participant if not already
        User sender = message.getUser();
        if (!conversation.getParticipants().contains(sender)) {
            conversation.addParticipant(sender);
        }

        Message savedMessage = messageRepository.save(message);
        return convertToDTO(savedMessage);
    }

    // Update a message
    @Transactional
    public MessageDTO updateMessage(Long id, MessageDTO messageDTO) {
        Message existingMessage = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));

        // Convert any JSON objects to string if needed
        if (messageDTO.getContent() != null) {
            if (!(messageDTO.getContent() instanceof String)) {
                try {
                    messageDTO.setContent(objectMapper.writeValueAsString(messageDTO.getContent()));
                } catch (JsonProcessingException e) {
                    throw new IllegalArgumentException("Failed to convert content to string: " + e.getMessage());
                }
            }
            existingMessage.setContent(messageDTO.getContent());
        }

        // Update concept tags if provided
        if (messageDTO.getConceptTags() != null) {
            existingMessage.setConceptTags(messageDTO.getConceptTags());
        }

        Message updatedMessage = messageRepository.save(existingMessage);
        return convertToDTO(updatedMessage);
    }

    // Delete a message
    @Transactional
    public void deleteMessage(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + id));
        messageRepository.delete(message);
    }

    // Search messages by content or tags
    public List<MessageDTO> searchMessages(String searchTerm) {
        return messageRepository.searchMessages(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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