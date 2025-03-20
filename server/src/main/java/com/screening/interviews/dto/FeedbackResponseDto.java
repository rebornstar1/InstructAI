package com.screening.interviews.dto;

import com.screening.interviews.enums.Recommendation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponseDto {
    private Long feedbackId;
    private Long interviewId;
    private Long interviewerId;
    private Recommendation recommendation;
    private LocalDateTime submittedAt;
    private Map<String, Object> feedbackData;
}