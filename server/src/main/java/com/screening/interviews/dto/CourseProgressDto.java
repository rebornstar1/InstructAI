package com.screening.interviews.dto;

import com.screening.interviews.model.UserCourseProgress;
import com.screening.interviews.model.UserModuleProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressDto {
    private Long courseId;
    private String courseTitle;
    private int progressPercentage;
    private String state;
    private LocalDateTime startedAt;
    private LocalDateTime lastAccessedAt;
    private LocalDateTime completedAt;
    private Long lastAccessedModuleId;
    private String lastAccessedModuleTitle;
    private int earnedXP;

    // Factory method to convert from entity
    public static CourseProgressDto fromEntity(UserCourseProgress entity) {
        return CourseProgressDto.builder()
                .courseId(entity.getCourse().getId())
                .courseTitle(entity.getCourse().getTitle())
                .progressPercentage(entity.getProgressPercentage())
                .state(entity.getState().name())
                .startedAt(entity.getStartedAt())
                .lastAccessedAt(entity.getLastAccessedAt())
                .completedAt(entity.getCompletedAt())
                .lastAccessedModuleId(entity.getLastAccessedModule() != null ?
                        entity.getLastAccessedModule().getId() : null)
                .lastAccessedModuleTitle(entity.getLastAccessedModule() != null ?
                        entity.getLastAccessedModule().getTitle() : null)
                .earnedXP(entity.getEarnedXP())
                .build();
    }
}
