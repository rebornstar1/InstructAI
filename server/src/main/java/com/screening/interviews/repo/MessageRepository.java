package com.screening.interviews.repo;

import com.screening.interviews.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Find all messages in a conversation
    List<Message> findByConversationIdOrderByTimestamp(Long conversationId);

    // Find only top-level messages in a conversation (ones that aren't replies)
    List<Message> findByConversationIdAndReplyToMessageIsNullOrderByTimestamp(Long conversationId);

    // Find all replies to a specific message
    List<Message> findByReplyToMessageIdOrderByTimestamp(Long messageId);

    // Search messages by content or tags - now content is a regular string field
    @Query("SELECT m FROM Message m " +
            "WHERE m.content LIKE %:searchTerm% " +
            "OR m.messageType LIKE %:searchTerm% " +
            "OR EXISTS (SELECT t FROM m.conceptTags t WHERE t LIKE %:searchTerm%)")
    List<Message> searchMessages(@Param("searchTerm") String searchTerm);
}