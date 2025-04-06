
package com.screening.interviews.dto;

import com.screening.interviews.model.UserModuleProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleProgressDto {
    private Long moduleId;
    private String moduleTitle;
    private int progressPercentage;
    private String state;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean quizCompleted;
    private Integer bestQuizScore;
    private int completedSubmodules;
    private int totalSubmodules;
    private int earnedXP;

    // Factory method to convert from entity
    public static ModuleProgressDto fromEntity(UserModuleProgress entity) {
        return ModuleProgressDto.builder()
                .moduleId(entity.getModule().getId())
                .moduleTitle(entity.getModule().getTitle())
                .progressPercentage(entity.getProgressPercentage())
                .state(entity.getState().name())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .quizCompleted(entity.isQuizCompleted())
                .bestQuizScore(entity.getBestQuizScore())
                .completedSubmodules(entity.getCompletedSubmodules())
                .totalSubmodules(entity.getTotalSubmodules())
                .earnedXP(entity.getEarnedXP())
                .build();
    }
}