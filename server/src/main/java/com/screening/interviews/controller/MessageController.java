package com.screening.interviews.controller;

import com.screening.interviews.dto.community.MessageDTO;
import com.screening.interviews.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MessageController {

    @Autowired
    private MessageService messageService;

    // Get all messages in a conversation
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessagesByConversationId(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getMessagesByConversationId(conversationId));
    }

    // Get only top-level messages in a conversation
    @GetMapping("/conversations/{conversationId}/top-level-messages")
    public ResponseEntity<List<MessageDTO>> getTopLevelMessagesByConversationId(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getTopLevelMessagesByConversationId(conversationId));
    }

    // Get threaded messages (top-level messages with their replies)
    @GetMapping("/conversations/{conversationId}/threaded-messages")
    public ResponseEntity<List<MessageDTO>> getThreadedMessagesByConversationId(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getThreadedMessagesByConversationId(conversationId));
    }

    // Get message by ID
    @GetMapping("/messages/{id}")
    public ResponseEntity<MessageDTO> getMessageById(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.getMessageById(id));
    }

    // Create a new top-level message
    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDTO> createMessage(
            @PathVariable Long conversationId,
            @RequestBody MessageDTO messageDTO) {
        messageDTO.setConversationId(conversationId);
        messageDTO.setReplyToMessageId(null); // Ensure it's a top-level message
        messageDTO.setTopLevelMessage(true);
        return new ResponseEntity<>(messageService.createMessage(messageDTO), HttpStatus.CREATED);
    }

    // Create a reply to a message
    @PostMapping("/messages/{messageId}/replies")
    public ResponseEntity<MessageDTO> createReply(
            @PathVariable Long messageId,
            @RequestBody MessageDTO messageDTO) {
        // Set the parent message ID
        messageDTO.setReplyToMessageId(messageId);
        messageDTO.setTopLevelMessage(false);

        // We need to get the conversation ID from the parent message
        MessageDTO parentMessage = messageService.getMessageById(messageId);
        messageDTO.setConversationId(parentMessage.getConversationId());

        return new ResponseEntity<>(messageService.createMessage(messageDTO), HttpStatus.CREATED);
    }

    // Update a message
    @PutMapping("/messages/{id}")
    public ResponseEntity<MessageDTO> updateMessage(
            @PathVariable Long id,
            @RequestBody MessageDTO messageDTO) {
        return ResponseEntity.ok(messageService.updateMessage(id, messageDTO));
    }

    // Delete a message
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }

//    // Search messages
//    @GetMapping("/messages/search")
//    public ResponseEntity<List<MessageDTO>> searchMessages(@RequestParam String term) {
//        return ResponseEntity.ok(messageService.searchMessages(term));
//    }
}