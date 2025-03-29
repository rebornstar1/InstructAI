package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for interactive questions presented to the user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractiveQuestionDto {
    private String sessionId; // Unique identifier for this interaction session
    private String title; // Title for the question set
    private String description; // Description for the question set
    private List<Map<String, Object>> questions; // List of questions with their options
}