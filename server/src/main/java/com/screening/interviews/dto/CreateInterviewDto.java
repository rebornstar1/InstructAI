package com.screening.interviews.dto;

import com.screening.interviews.config.CustomLocalDateTimeDeserializer;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import lombok.Data;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CreateInterviewDto {

    @NotNull
    private Long candidateId;

    @NotNull
    @Email
    private String candidateEmail;

    @NotNull
    private String position;

    @Min(1)
    private Integer roundNumber;

    @NotNull
    @JsonDeserialize(using = CustomLocalDateTimeDeserializer.class)
    private LocalDateTime interviewDate;

    // Optional (defaults to VIRTUAL)
    private InterviewMode mode;

    private String resumeContent;

    private String resumeSummary;

    // New fields for resume file URL
    private String resumeFileUrl;
    private String resumeFileName;
    private String resumeFileExpiresAfter;

    private String meetingLink;

    @NotNull
    private UUID jobId;

    // Optional (defaults to SCHEDULED)
    private InterviewStatus status;

    // Email content for interviewers and candidate.
    private String interviewerEmailContent;
    private String candidateEmailContent;

    // List of interviewers to notify.
    private List<InterviewerDto> interviewers;

    // For template-based feedback.
    private List<String> feedbackTemplates;

    // For manual feedback questions.
    private List<String> manualFeedbackQuestions;

    // For AI-generated feedback prompt.
    private String aiPrompt;

    // Indicates which feedback method was chosen: "template", "ai", or "manual"
    private String feedbackMethod;
}