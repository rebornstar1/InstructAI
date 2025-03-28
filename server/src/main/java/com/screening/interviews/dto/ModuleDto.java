package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDto {
    private Long id;
    private String moduleId;  // e.g. M1, M2, etc.
    private String title;
    private String description;
    private String duration;  // e.g. "45 minutes"

    // New fields for improved gradation and organization
    private String complexityLevel;  // Foundational, Basic, Intermediate, Advanced, Expert
    private List<String> keyTerms;  // Important terms or concepts in this module
    private List<String> learningObjectives;
    private List<String> prerequisiteModules;  // Modules that should be completed before this one
}