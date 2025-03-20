package com.screening.interviews.dto;

import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InterviewResponseDto {
    private Long interviewId;
    private Long candidateId;
    private String candidateEmail;
    private String position;
    private Integer roundNumber;
    private LocalDateTime interviewDate;
    private InterviewMode mode;
    private String meetingLink;
    private InterviewStatus status;
    private LocalDateTime createdAt;  // Ensure this field exists
    private Boolean emailSent;
    private List<InterviewerResponseDto> interviewers;
    private String resumeContent;
    private String resumeSummary;

    // Fields for resume file URL
    private String resumeFileUrl;
    private String resumeFileName;
    private String resumeFileExpiresAfter;

    // Optional fields that might be referenced in your mapper
    private UUID jobId;
    private Long candidateJobId;
    private String secureToken;
    private LocalDateTime tokenExpiration;
    private String candidateEmailContent;
    private String interviewerEmailContent;
    private List<FeedbackTemplateDto> feedbackTemplates;
}