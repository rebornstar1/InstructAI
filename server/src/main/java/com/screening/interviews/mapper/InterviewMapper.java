package com.screening.interviews.mapper;

import com.screening.interviews.dto.FeedbackTemplateDto;
import com.screening.interviews.dto.InterviewResponseDto;
import com.screening.interviews.dto.InterviewerResponseDto;
import com.screening.interviews.model.FeedbackTemplate;
import com.screening.interviews.model.Interview;
import com.screening.interviews.model.InterviewersInterview;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class InterviewMapper {

    public InterviewResponseDto toDto(Interview interview) {
        if (interview == null) {
            return null;
        }

        // Map interviewers if present
        List<InterviewerResponseDto> interviewerDtos = new ArrayList<>();
        if (interview.getInterviewers() != null) {
            interviewerDtos = interview.getInterviewers().stream()
                    .map(this::mapInterviewer)
                    .collect(Collectors.toList());
        }

        // Map feedback templates if present
        List<FeedbackTemplateDto> templateDtos = new ArrayList<>();
        if (interview.getFeedbackTemplates() != null) {
            templateDtos = interview.getFeedbackTemplates().stream()
                    .map(this::mapFeedbackTemplate)
                    .collect(Collectors.toList());
        }

        // Build the response DTO with all fields
        return InterviewResponseDto.builder()
                .interviewId(interview.getInterviewId())
                .jobId(interview.getJobId())
                .candidateId(interview.getCandidateId())
                .candidateEmail(interview.getCandidateEmail())
                .candidateJobId(interview.getCandidateJob() != null ? interview.getCandidateJob().getId() : null)
                .position(interview.getPosition())
                .roundNumber(interview.getRoundNumber())
                .interviewDate(interview.getInterviewDate())
                .mode(interview.getMode())
                .meetingLink(interview.getMeetingLink())
                .status(interview.getStatus())
                .createdAt(interview.getCreatedAt())
                .emailSent(interview.getEmailSent())
                .secureToken(interview.getSecureToken())
                .tokenExpiration(interview.getTokenExpiration())
                .resumeContent(interview.getResumeContent())
                .resumeSummary(interview.getResumeSummary())
                .resumeFileUrl(interview.getResumeFileUrl())
                .resumeFileName(interview.getResumeFileName())
                .resumeFileExpiresAfter(interview.getResumeFileExpiresAfter())
                .candidateEmailContent(interview.getCandidateEmailContent())
                .interviewerEmailContent(interview.getInterviewerEmailContent())
                .interviewers(interviewerDtos)
                .feedbackTemplates(templateDtos)
                .build();
    }

    private InterviewerResponseDto mapInterviewer(InterviewersInterview interviewer) {
        if (interviewer == null) {
            return null;
        }

        return InterviewerResponseDto.builder()
                .userId(interviewer.getId().getUserId())
                .name(interviewer.getName())
                .email(interviewer.getEmail())
                .build();
    }

    private FeedbackTemplateDto mapFeedbackTemplate(FeedbackTemplate template) {
        if (template == null) {
            return null;
        }

        return FeedbackTemplateDto.builder()
                .id(template.getId())
                .template(template.getTemplate())
                .build();
    }
}