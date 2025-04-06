package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_module_progress")
public class UserModuleProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    // Progress percentage for this module (0-100)
    private int progressPercentage = 0;

    // Current state of the module for this user
    @Enumerated(EnumType.STRING)
    private ModuleState state = ModuleState.LOCKED;

    // XP earned from this module
    private int earnedXP = 0;

    // Timestamp when the module was started
    private LocalDateTime startedAt;

    // Timestamp when the module was completed
    private LocalDateTime completedAt;

    // Best quiz score for this module (percentage)
    private Integer bestQuizScore = null;

    // Has the user taken the module quiz
    private boolean quizCompleted = false;

    // Count of completed submodules
    private int completedSubmodules = 0;

    // Total submodules in this module (cached for easy progress calculation)
    private int totalSubmodules = 0;

    public enum ModuleState {
        LOCKED,       // Not accessible yet
        UNLOCKED,     // Available but not started
        IN_PROGRESS,  // Started but not completed
        COMPLETED     // Fully completed
    }
}