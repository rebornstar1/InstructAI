package com.screening.interviews.dto;

import lombok.Data;
import java.util.List;

@Data
public class LearningResourceRequestDto {
    private String topic;
    private Long moduleId;
    private String moduleTitle;
    private String conceptTitle; // Optional: if generating resource for a particular concept
    private String format;       // e.g., "markdown"
    private String contentType;  // e.g., "technical" or "comprehensive"
    private int detailLevel;
    private List<String> specificRequirements;
}