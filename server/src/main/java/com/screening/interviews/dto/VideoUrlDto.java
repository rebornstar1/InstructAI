package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class VideoUrlDto {
    private Long id;
    private String url;
    private String type; // e.g., "main", "definition", "example"
    private String associatedTerm; // For videos that explain specific terms
    private String title;
    private String description;
}