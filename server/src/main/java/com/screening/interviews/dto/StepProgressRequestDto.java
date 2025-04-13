package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for handling step progress requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StepProgressRequestDto {

    // Progress percentage (0-100) for article reading or video watching
    private Integer percentage;

    // Quiz score (0-100)
    private Integer score;

    // Optional key term index if this step is part of a key term
    private Integer keyTermIndex;

    // Optional status update
    private String status;
}