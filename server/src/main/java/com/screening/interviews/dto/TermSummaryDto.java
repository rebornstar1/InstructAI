package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TermSummaryDto {
    private String term;
    private String definition;
    private Integer termIndex;

    // Status information
    private boolean unlocked;
    private boolean completed;
    private boolean active;

    // Resource availability
    private boolean articleAvailable;
    private boolean videoAvailable;
    private boolean quizAvailable;

    // Resource completion status
    private boolean articleCompleted;
    private boolean videoCompleted;
    private boolean quizCompleted;
}