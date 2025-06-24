package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor  // Required for Jackson deserialization
@AllArgsConstructor // Required for @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class SubModuleDto {
    private Long moduleId;
    private String subModuleTitle;  // Title for the submodule (e.g., "Introduction to Encapsulation")
    private String article;         // The generated text article for the submodule
    private List<String> tags;      // Relevant tags for quick filtering/search
    private List<String> keywords;  // Important keywords related to the submodule topic
    private String readingTime;     // Estimated reading time (e.g., "5 minutes")
}
