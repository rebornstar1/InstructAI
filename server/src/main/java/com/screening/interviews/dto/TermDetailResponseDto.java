package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for detailed term information including resources and progress
 */
@Data
@Builder
@NoArgsConstructor  // Required for Jackson deserialization
@AllArgsConstructor // Required for @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TermDetailResponseDto {
    private boolean success;
    private String message;

    // Term information
    private String term;
    private String definition;
    private Integer termIndex;

    // Term resources
    private SubModuleDto article;
    private QuizDto quiz;
    private String videoUrl;

    // Progress information
    private boolean isCompleted;
    private TermResourceProgressDto resourceProgress;

    // If this is the last term in the module
    private boolean isLastTerm;

    // Information about next available term if this one is completed
    private Integer nextTermIndex;
    private boolean nextTermUnlocked;

    public TermDetailResponseDto(boolean success, String message, String term, String definition,
                                 Integer termIndex, TermResourceProgressDto resourceProgress) {
        this.success = success;
        this.message = message;
        this.term = term;
        this.definition = definition;
        this.termIndex = termIndex;
        this.resourceProgress = resourceProgress;
    }
}