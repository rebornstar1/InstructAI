package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * Entity to track progress of individual learning steps within a module.
 * This includes articles (submodules), videos, and quizzes for each key term.
 */
@Getter
@Setter
@Entity
@Table(name = "user_module_step_progress")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserModuleStepProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_module_progress_id", nullable = false)
    private UserModuleProgress userModuleProgress;

    // Optional reference to the specific submodule (article) if this step is an article
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submodule_id")
    private SubModule subModule;

    // Optional reference to the specific quiz if this step is a quiz
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    // For video steps, store the video ID as there may not be a dedicated entity for videos
    private String videoId;

    // Type of learning step
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepType stepType;

    // If this step belongs to a key term, store the term index
    private Integer keyTermIndex;

    // Current status of this step
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepStatus status = StepStatus.NOT_STARTED;

    // XP earned for completing this step
    private int earnedXP = 0;

    // For quiz steps, store the best score
    private Integer bestScore;

    // Timestamps for tracking activity
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime lastAccessedAt;

    // For videos, track the watch progress (percentage watched)
    private Integer watchProgressPercentage;

    // For articles, track the read progress (percentage read)
    private Integer readProgressPercentage;

    // Types of learning steps
    public enum StepType {
        ARTICLE,    // Reading material (SubModule)
        VIDEO,      // Video content
        QUIZ,       // Knowledge assessment
        KEY_TERM    // Key term completion (parent step that combines other steps)
    }

    // Status of each step
    public enum StepStatus {
        NOT_STARTED,  // User hasn't started this step
        IN_PROGRESS,  // User has started but not completed
        COMPLETED     // User has completed this step
    }

    /**
     * Mark this step as completed and update timestamps
     */
    public void complete() {
        this.status = StepStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.lastAccessedAt = LocalDateTime.now();

        // Set progress to 100% when completed
        if (this.stepType == StepType.ARTICLE) {
            this.readProgressPercentage = 100;
        } else if (this.stepType == StepType.VIDEO) {
            this.watchProgressPercentage = 100;
        }
    }

    /**
     * Update progress percentages for articles and videos
     */
    public void updateProgress(int percentage) {
        if (this.stepType == StepType.ARTICLE) {
            this.readProgressPercentage = percentage;
        } else if (this.stepType == StepType.VIDEO) {
            this.watchProgressPercentage = percentage;
        }

        this.lastAccessedAt = LocalDateTime.now();

        // If first update, mark as started
        if (this.status == StepStatus.NOT_STARTED) {
            this.status = StepStatus.IN_PROGRESS;
            this.startedAt = LocalDateTime.now();
        }

        // If 100%, mark as completed
        if (percentage >= 100) {
            this.complete();
        }
    }

    /**
     * Update quiz score and complete if passing score is achieved
     */
    public void updateQuizScore(int score) {
        // Only update if this is a quiz
        if (this.stepType != StepType.QUIZ) {
            return;
        }

        // Update best score if this score is higher
        if (this.bestScore == null || score > this.bestScore) {
            this.bestScore = score;
        }

        // Mark as completed regardless of score
        this.complete();
    }
}