package com.screening.interviews.repo;

import com.screening.interviews.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByThreadId(Long threadId);

    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p.id = :userId")
    List<Conversation> findByParticipantId(@Param("userId") Long userId);
}