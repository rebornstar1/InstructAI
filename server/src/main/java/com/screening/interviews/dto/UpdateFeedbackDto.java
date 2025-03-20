package com.screening.interviews.dto;

import com.screening.interviews.enums.Recommendation;
import lombok.Data;

import java.util.Map;

@Data
public class UpdateFeedbackDto {

    private Recommendation recommendation;

    // When updating, you can either merge with the existing map or replace it entirely.
    private Map<String, Object> feedbackData;
}
