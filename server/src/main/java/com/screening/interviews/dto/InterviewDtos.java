package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Contains all DTOs for the interview system
 */
public class InterviewDtos {

    /**
     * DTO for Candidate details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateDto {
        private Long id;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String resumeContent;
        private String resumeSummary;
    }

    /**
     * DTO for Job details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobDto {
        private UUID id;
        private String title;
        private String department;
        private String location;
    }

    /**
     * DTO for interviewer details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewerDto {
        private Long userId;
        private String name;
        private String email;
    }

    /**
     * DTO for interview details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewDetailDto {
        private Long interviewId;
        private Integer roundNumber;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime interviewDate;

        private String position;
        private InterviewStatus status;
        private InterviewMode mode;
        private String meetingLink;
        private Long testId;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;

        private String resumeContent;
        private String resumeSummary;
        private List<InterviewerDto> interviewers = new ArrayList<>();
        private List<String> feedbackTemplates = new ArrayList<>();
        private String feedback;
    }

    /**
     * DTO for candidate job details, including interviews
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateJobDetailDto {
        private Long id;
        private CandidateDto candidate;
        private JobDto job;
        private Integer currentRound;
        private String status;
        private List<InterviewDetailDto> interviews = new ArrayList<>();
    }

    /**
     * DTO for candidate job summary (used in list views)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateJobSummaryDto {
        private Long id;
        private CandidateDto candidate;
        private JobDto job;
        private Integer currentRound;
        private String status;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastInterviewDate;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime nextInterviewDate;
    }
}
