package com.screening.interviews.service;

import com.screening.interviews.dto.community.ConversationDTO;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Conversation;
import com.screening.interviews.model.Thread;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.ConversationRepository;
import com.screening.interviews.repo.ThreadRepository;
import com.screening.interviews.repo.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ThreadRepository threadRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all conversations in a thread
    public List<ConversationDTO> getConversationsByThreadId(Long threadId) {
        return conversationRepository.findByThreadId(threadId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get conversation by ID
    public ConversationDTO getConversationById(Long id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));
        return convertToDTO(conversation);
    }

    // Create a new conversation
    @Transactional
    public ConversationDTO createConversation(ConversationDTO conversationDTO) {
        Conversation conversation = convertToEntity(conversationDTO);
        Conversation savedConversation = conversationRepository.save(conversation);
        return convertToDTO(savedConversation);
    }

    // Update a conversation
    @Transactional
    public ConversationDTO updateConversation(Long id, ConversationDTO conversationDTO) {
        Conversation existingConversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));

        existingConversation.setTitle(conversationDTO.getTitle());
        existingConversation.setLastActivityAt(LocalDateTime.now());

        // Update concept tags
        if (conversationDTO.getConceptTags() != null) {
            existingConversation.setConceptTags(conversationDTO.getConceptTags());
        }

        Conversation updatedConversation = conversationRepository.save(existingConversation);
        return convertToDTO(updatedConversation);
    }

    // Delete a conversation
    @Transactional
    public void deleteConversation(Long id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));
        conversationRepository.delete(conversation);
    }

    // Add participant to conversation
    @Transactional
    public void addParticipantToConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        conversation.addParticipant(user);
        conversation.updateLastActivity();
        conversationRepository.save(conversation);
    }

    // Remove participant from conversation
    @Transactional
    public void removeParticipantFromConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        conversation.removeParticipant(user);
        conversationRepository.save(conversation);
    }

    // Get conversations by participant
    public List<ConversationDTO> getConversationsByParticipantId(Long userId) {
        return conversationRepository.findByParticipantId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods for DTO conversion
    private ConversationDTO convertToDTO(Conversation conversation) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setTitle(conversation.getTitle());
        dto.setThreadId(conversation.getThread().getId());
        dto.setStartedAt(conversation.getStartedAt());
        dto.setLastActivityAt(conversation.getLastActivityAt());

        dto.setParticipantIds(conversation.getParticipants().stream()
                .map(User::getId)
                .collect(Collectors.toList()));

        dto.setConceptTags(conversation.getConceptTags());

        return dto;
    }

    private Conversation convertToEntity(ConversationDTO dto) {
        Conversation conversation = new Conversation();
        conversation.setTitle(dto.getTitle());

        Thread thread = threadRepository.findById(dto.getThreadId())
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + dto.getThreadId()));
        conversation.setThread(thread);

        if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
            for (Long userId : dto.getParticipantIds()) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                conversation.addParticipant(user);
            }
        }

        if (dto.getConceptTags() != null) {
            conversation.setConceptTags(dto.getConceptTags());
        }

        return conversation;
    }
}
