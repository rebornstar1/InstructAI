package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_course_progress")
public class UserCourseProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // Progress percentage for the entire course (0-100)
    private int progressPercentage = 0;

    // Timestamp when the course was started
    private LocalDateTime startedAt;

    // Timestamp when the course was last accessed
    private LocalDateTime lastAccessedAt;

    // Timestamp when the course was completed (null if not completed)
    private LocalDateTime completedAt;

    // Current state of the course for this user
    @Enumerated(EnumType.STRING)
    private ProgressState state = ProgressState.NOT_STARTED;

    // Last module accessed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_accessed_module_id")
    private Module lastAccessedModule;

    // XP earned from this course
    private int earnedXP = 0;

    public enum ProgressState {
        NOT_STARTED,  // User hasn't started the course
        IN_PROGRESS,  // User has started but not completed the course
        COMPLETED     // User has completed the course
    }
}