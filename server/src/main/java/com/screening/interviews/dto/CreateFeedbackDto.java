package com.screening.interviews.dto;

import com.screening.interviews.enums.Recommendation;
import lombok.Data;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

@Data
public class CreateFeedbackDto {

    @NotNull(message = "Interview ID must not be null")
    private Long interviewId;

    @NotNull(message = "Interviewer ID must not be null")
    private Long interviewerId;

    // Optional; if not provided, the service defaults to Recommendation.PROCEED.
    private Recommendation recommendation;

    // Dynamic feedback data. For example:
    // { "technicalSkills": 5, "communication": 4, "notes": "Excellent performance" }
    @NotNull(message = "Feedback data must not be null")
    private Map<String, Object> feedbackData;
}
