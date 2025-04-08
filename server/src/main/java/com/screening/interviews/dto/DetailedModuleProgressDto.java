package com.screening.interviews.dto;

import com.screening.interviews.model.UserModuleProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for detailed module progress including all content items
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedModuleProgressDto {
    // Module progress details
    private Long moduleId;
    private String moduleTitle;
    private String moduleState;
    private int progressPercentage;
    private int earnedXP;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer bestQuizScore;
    private boolean quizCompleted;
    private int completedSubmodules;
    private int totalSubmodules;

    // Content items progress
    private List<ContentProgressDto> submodules;
    private List<ContentProgressDto> videos;
    private List<ContentProgressDto> quizzes;

    /**
     * Convert from module progress entity and content lists
     */
    public static DetailedModuleProgressDto fromEntities(
            UserModuleProgress moduleProgress,
            List<ContentProgressDto> submodules,
            List<ContentProgressDto> videos,
            List<ContentProgressDto> quizzes) {

        return DetailedModuleProgressDto.builder()
                .moduleId(moduleProgress.getModule().getId())
                .moduleTitle(moduleProgress.getModule().getTitle())
                .moduleState(moduleProgress.getState().name())
                .progressPercentage(moduleProgress.getProgressPercentage())
                .earnedXP(moduleProgress.getEarnedXP())
                .startedAt(moduleProgress.getStartedAt())
                .completedAt(moduleProgress.getCompletedAt())
                .bestQuizScore(moduleProgress.getBestQuizScore())
                .quizCompleted(moduleProgress.isQuizCompleted())
                .completedSubmodules(moduleProgress.getCompletedSubmodules())
                .totalSubmodules(moduleProgress.getTotalSubmodules())
                .submodules(submodules)
                .videos(videos)
                .quizzes(quizzes)
                .build();
    }
}