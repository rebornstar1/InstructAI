package com.screening.interviews.mapper;

import com.screening.interviews.dto.FeedbackResponseDto;
import com.screening.interviews.dto.FeedbackResponseDto;
import com.screening.interviews.model.Feedback;

import java.util.List;
import java.util.stream.Collectors;

public class FeedbackMapper {

    public static FeedbackResponseDto toDTO(Feedback feedback) {
        return FeedbackResponseDto.builder()
                .feedbackId(feedback.getFeedbackId())
                .interviewId(feedback.getInterview().getInterviewId()) // Extract the interviewId from the Interview entity
                .interviewerId(feedback.getInterviewerId())
                .recommendation(feedback.getRecommendation())
                .submittedAt(feedback.getSubmittedAt())
                .feedbackData(feedback.getFeedbackData())
                .build();
    }

    public static List<FeedbackResponseDto> toDTOList(List<Feedback> feedbacks) {
        return feedbacks.stream()
                .map(FeedbackMapper::toDTO)
                .collect(Collectors.toList());
    }
}