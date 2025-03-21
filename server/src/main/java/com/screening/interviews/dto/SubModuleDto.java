package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SubModuleDto {
    private String subModuleTitle;  // Title for the submodule (e.g., "Introduction to Encapsulation")
    private String article;         // The generated text article for the submodule
    private List<String> tags;      // Relevant tags for quick filtering/search
    private List<String> keywords;  // Important keywords related to the submodule topic
    private String readingTime;     // Estimated reading time (e.g., "5 minutes")
}
