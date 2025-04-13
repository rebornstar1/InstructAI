package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

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

    // *** Key Terms Tracking ***

    // The index of the currently active key term
    private Integer activeTerm = 0;

    // ElementCollection to store which term indices are unlocked
    @ElementCollection
    @CollectionTable(name = "user_module_unlocked_terms",
            joinColumns = @JoinColumn(name = "user_module_progress_id"))
    @Column(name = "term_index")
    private List<Integer> unlockedTerms = new ArrayList<>();

    // ElementCollection to store which term indices are completed
    @ElementCollection
    @CollectionTable(name = "user_module_completed_terms",
            joinColumns = @JoinColumn(name = "user_module_progress_id"))
    @Column(name = "term_index")
    private List<Integer> completedTerms = new ArrayList<>();

    // Store metadata about term resources (JSON stored as String)
    @Column(columnDefinition = "text")
    private String termResourcesData;

    public enum ModuleState {
        LOCKED,       // Not accessible yet
        UNLOCKED,     // Available but not started
        IN_PROGRESS,  // Started but not completed
        COMPLETED     // Fully completed
    }

    // Helper methods for key term tracking

    public boolean isTermUnlocked(int termIndex) {
        return unlockedTerms != null && unlockedTerms.contains(termIndex);
    }

    public boolean isTermCompleted(int termIndex) {
        return completedTerms != null && completedTerms.contains(termIndex);
    }

    public void unlockTerm(int termIndex) {
        if (unlockedTerms == null) {
            unlockedTerms = new ArrayList<>();
        }
        if (!unlockedTerms.contains(termIndex)) {
            unlockedTerms.add(termIndex);
        }
    }

    public void completeTerm(int termIndex) {
        if (completedTerms == null) {
            completedTerms = new ArrayList<>();
        }
        if (!completedTerms.contains(termIndex)) {
            completedTerms.add(termIndex);
        }
    }
}