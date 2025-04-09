// ConversationController.java
package com.screening.interviews.controller;

import com.screening.interviews.dto.community.ConversationDTO;
import com.screening.interviews.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    // Get all conversations in a thread
    @GetMapping("/threads/{threadId}/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversationsByThreadId(@PathVariable Long threadId) {
        return ResponseEntity.ok(conversationService.getConversationsByThreadId(threadId));
    }

    // Get conversation by ID
    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationDTO> getConversationById(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.getConversationById(id));
    }

    // Create a new conversation
    @PostMapping("/threads/{threadId}/conversations")
    public ResponseEntity<ConversationDTO> createConversation(
            @PathVariable Long threadId,
            @RequestBody ConversationDTO conversationDTO) {
        conversationDTO.setThreadId(threadId);
        return new ResponseEntity<>(conversationService.createConversation(conversationDTO), HttpStatus.CREATED);
    }

    // Update a conversation
    @PutMapping("/conversations/{id}")
    public ResponseEntity<ConversationDTO> updateConversation(
            @PathVariable Long id,
            @RequestBody ConversationDTO conversationDTO) {
        return ResponseEntity.ok(conversationService.updateConversation(id, conversationDTO));
    }

    // Delete a conversation
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    // Add participant to conversation
    @PostMapping("/conversations/{conversationId}/participants/{userId}")
    public ResponseEntity<Void> addParticipantToConversation(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        conversationService.addParticipantToConversation(conversationId, userId);
        return ResponseEntity.noContent().build();
    }

    // Remove participant from conversation
    @DeleteMapping("/conversations/{conversationId}/participants/{userId}")
    public ResponseEntity<Void> removeParticipantFromConversation(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        conversationService.removeParticipantFromConversation(conversationId, userId);
        return ResponseEntity.noContent().build();
    }

    // Get conversations by participant
    @GetMapping("/users/{userId}/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversationsByParticipantId(@PathVariable Long userId) {
        return ResponseEntity.ok(conversationService.getConversationsByParticipantId(userId));
    }
}

// MessageController.java
