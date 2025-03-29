package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractiveResponseDto {
    private String sessionId; // Session identifier
    private boolean complete; // Whether the interactive flow is complete
    private String message; // Optional message to display to the user
    private InteractiveQuestionDto nextQuestions; // Next set of questions if not complete
}