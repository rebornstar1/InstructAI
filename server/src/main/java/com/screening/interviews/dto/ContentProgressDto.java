package com.screening.interviews.dto;

import com.screening.interviews.model.UserSubmoduleProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for representing detailed content item progress
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentProgressDto {
    private Long id;
    private Long userId;
    private Long moduleId;
    private String contentType;
    private String contentId;
    private boolean completed;
    private LocalDateTime completedAt;
    private Integer score;
    private int earnedXP;

    /**
     * Convert entity to DTO
     */
    public static ContentProgressDto fromEntity(UserSubmoduleProgress entity) {
        return ContentProgressDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .moduleId(entity.getModule().getId())
                .contentType(entity.getContentType().name())
                .contentId(entity.getContentId())
                .completed(entity.isCompleted())
                .completedAt(entity.getCompletedAt())
                .score(entity.getScore())
                .earnedXP(entity.getEarnedXP())
                .build();
    }
}