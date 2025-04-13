package com.screening.interviews.dto;

import com.screening.interviews.model.UserModuleProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleProgressDto {
    private Long id;
    private Long userId;
    private Long moduleId;
    private String moduleTitle;
    private int progressPercentage;
    private String state;
    private int earnedXP;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer bestQuizScore;
    private boolean quizCompleted;
    private int completedSubmodules;
    private int totalSubmodules;

    // Key term tracking
    private Integer activeTerm;
    private List<Integer> unlockedTerms = new ArrayList<>();
    private List<Integer> completedTerms = new ArrayList<>();
    private String termResourcesData;

    public static ModuleProgressDto fromEntity(UserModuleProgress entity) {
        return ModuleProgressDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .moduleId(entity.getModule().getId())
                .moduleTitle(entity.getModule().getTitle())
                .progressPercentage(entity.getProgressPercentage())
                .state(entity.getState().name())
                .earnedXP(entity.getEarnedXP())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .bestQuizScore(entity.getBestQuizScore())
                .quizCompleted(entity.isQuizCompleted())
                .completedSubmodules(entity.getCompletedSubmodules())
                .totalSubmodules(entity.getTotalSubmodules())
                .activeTerm(entity.getActiveTerm())
                .unlockedTerms(entity.getUnlockedTerms())
                .completedTerms(entity.getCompletedTerms())
                .termResourcesData(entity.getTermResourcesData())
                .build();
    }
}