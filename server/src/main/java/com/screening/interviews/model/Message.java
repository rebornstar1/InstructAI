package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Changed from Object to String
    @Column(columnDefinition = "text", nullable = false)
    private String content;

    @Column(nullable = false)
    private String messageType;

    @ElementCollection
    @CollectionTable(name = "message_concept_tags",
            joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "tag")
    private List<String> conceptTags = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "reply_to_message_id")
    private Message replyToMessage;
}