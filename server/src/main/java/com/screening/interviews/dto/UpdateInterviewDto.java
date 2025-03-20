package com.screening.interviews.dto;

import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

@Data
@Builder
public class UpdateInterviewDto {
    private Long candidateId;
    private Integer roundNumber;
    private LocalDateTime interviewDate;
    private InterviewMode mode;
    private String meetingLink;
    private InterviewStatus status;
}