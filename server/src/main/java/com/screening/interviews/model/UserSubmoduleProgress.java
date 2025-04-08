package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Tracks completion of individual content items (submodules, videos, quizzes)
 * This provides fine-grained tracking of individual learning content
 */
@Getter
@Setter
@Entity
@Table(name = "user_submodule_progress")
public class UserSubmoduleProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    // Type of content item being tracked
    @Enumerated(EnumType.STRING)
    private ContentType contentType;

    // ID of content item (submodule ID, quiz ID, or video URL)
    // Using a string to handle all potential ID types
    @Column(nullable = false)
    private String contentId;

    // Timestamp when this content was completed
    private LocalDateTime completedAt;

    // For quiz content, track the score
    private Integer score;

    // How much XP was earned from this content
    private int earnedXP = 0;

    // Flag indicating completion status
    private boolean completed = false;

    // Additional metadata (JSON format) for future extensibility
    @Column(columnDefinition = "text")
    private String metadata;

    public enum ContentType {
        SUBMODULE,  // Text-based content
        VIDEO,      // Video content
        QUIZ        // Assessment
    }
}