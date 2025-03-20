package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LearningResourceDto {
    private String conceptTitle;
    private String moduleTitle;
    private String content;     // Detailed learning content (e.g. markdown)
    private String transcript;  // Transcript for video content
    private String videoUrl;    // URL for a generated video resource
}
