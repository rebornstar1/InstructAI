package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for returning all key terms for a module with their progress status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ModuleTermsResponseDto {
    private Long moduleId;
    private String moduleTitle;
    private boolean termsAvailable;
    private String message;

    private List<TermSummaryDto> terms;
    private Integer activeTermIndex;
    private int completedCount;
    private int totalCount;

    // Module progress information
    private int progressPercentage;
    private boolean moduleCompleted;
}