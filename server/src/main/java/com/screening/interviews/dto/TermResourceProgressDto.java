package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor  // Required for Jackson deserialization
@AllArgsConstructor // Required for @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TermResourceProgressDto {
    // Article progress
    private boolean articleAvailable;
    private boolean articleStarted;
    private boolean articleCompleted;
    private Integer articleProgress; // Percentage 0-100
    private Long articleId; // SubModule ID

    // Video progress
    private boolean videoAvailable;
    private boolean videoStarted;
    private boolean videoCompleted;
    private Integer videoProgress; // Percentage 0-100
    private String videoId;

    // Quiz progress
    private boolean quizAvailable;
    private boolean quizStarted;
    private boolean quizCompleted;
    private Integer quizScore; // Best score 0-100
    private Long quizId;
}
