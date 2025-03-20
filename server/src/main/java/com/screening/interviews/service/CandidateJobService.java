package com.screening.interviews.service;

import com.screening.interviews.dto.InterviewDtos.*;
import com.screening.interviews.model.*;
import com.screening.interviews.repo.CandidateJobRepository;
import com.screening.interviews.repo.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateJobService {

    private final CandidateJobRepository candidateJobRepository;
    private final CandidateRepository candidateRepository;

    /**
     * Get detailed information about a candidate's job application including all interviews
     * @param id Candidate job ID
     * @return Detailed DTO with candidate, job, and interview information
     */
    @Transactional(readOnly = true)
    public CandidateJobDetailDto getCandidateJobDetails(Long id) {
        CandidateJob candidateJob = candidateJobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate job not found with ID: " + id));

        return mapToCandidateJobDetailDto(candidateJob);
    }

    /**
     * Get detailed information about a candidate's job application by candidate ID and job ID
     * @param candidateId Candidate ID
     * @param jobId Job ID
     * @return Detailed DTO with candidate, job, and interview information
     */
    @Transactional(readOnly = true)
    public CandidateJobDetailDto getCandidateJobDetailsByCandidateAndJob(Long candidateId, UUID jobId) {
        CandidateJob candidateJob = candidateJobRepository.findByCandidateIdAndJobId(candidateId, jobId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Candidate job not found for candidate ID: " + candidateId + " and job ID: " + jobId));

        return mapToCandidateJobDetailDto(candidateJob);
    }

    /**
     * Get detailed information about a candidate's job application by candidate email and job ID
     * @param email Candidate email
     * @param jobId Job ID
     * @return Detailed DTO with candidate, job, and interview information
     */
    @Transactional(readOnly = true)
    public CandidateJobDetailDto getCandidateJobDetailsByEmailAndJob(String email, UUID jobId) {
        Candidate candidate = candidateRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with email: " + email));

        return getCandidateJobDetailsByCandidateAndJob(candidate.getId(), jobId);
    }

    /**
     * Get all candidates that have applied for a specific job
     * @param jobId The job ID
     * @return List of candidate job summaries
     */
    @Transactional(readOnly = true)
    public List<CandidateJobSummaryDto> getCandidatesByJobId(UUID jobId) {
        List<CandidateJob> candidateJobs = candidateJobRepository.findByJobId(jobId);
        return candidateJobs.stream()
                .map(this::mapToCandidateJobSummaryDto)
                .collect(Collectors.toList());
    }


    /**
     * Get all jobs that a candidate has applied for
     * @param candidateId The candidate ID
     * @return List of candidate job summaries
     */
    @Transactional(readOnly = true)
    public List<CandidateJobSummaryDto> getJobsByCandidateId(Long candidateId) {
        List<CandidateJob> candidateJobs = candidateJobRepository.findByCandidateId(candidateId);
        return candidateJobs.stream()
                .map(this::mapToCandidateJobSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * Maps a CandidateJob entity to a summary DTO (without detailed interview information)
     */
    private CandidateJobSummaryDto mapToCandidateJobSummaryDto(CandidateJob candidateJob) {
        // Map candidate details
        CandidateDto candidateDto = mapToCandidateDto(candidateJob.getCandidate());

        // Map job details
        JobDto jobDto = mapToJobDto(candidateJob.getJob());

        // Find last interview date
        LocalDateTime lastInterviewDate = null;
        LocalDateTime nextInterviewDate = null;

        if (candidateJob.getInterviews() != null && !candidateJob.getInterviews().isEmpty()) {
            // Find the most recent past interview
            Optional<Interview> lastInterview = candidateJob.getInterviews().stream()
                    .filter(i -> i.getInterviewDate().isBefore(LocalDateTime.now()))
                    .max(Comparator.comparing(Interview::getInterviewDate));

            if (lastInterview.isPresent()) {
                lastInterviewDate = lastInterview.get().getInterviewDate();
            }

            // Find the earliest upcoming interview
            Optional<Interview> nextInterview = candidateJob.getInterviews().stream()
                    .filter(i -> i.getInterviewDate().isAfter(LocalDateTime.now()))
                    .min(Comparator.comparing(Interview::getInterviewDate));

            if (nextInterview.isPresent()) {
                nextInterviewDate = nextInterview.get().getInterviewDate();
            }
        }

        // Build and return the summary DTO
        return CandidateJobSummaryDto.builder()
                .id(candidateJob.getId())
                .candidate(candidateDto)
                .job(jobDto)
                .currentRound(candidateJob.getCurrentRound())
                .status(candidateJob.getStatus())
                .lastInterviewDate(lastInterviewDate)
                .nextInterviewDate(nextInterviewDate)
                .build();
    }

    private CandidateDto mapToCandidateDto(Candidate candidate) {
        return CandidateDto.builder()
                .id(candidate.getId())
                .fullName(candidate.getFullName())
                .email(candidate.getEmail())
                .phoneNumber(candidate.getPhoneNumber())
                .resumeContent(candidate.getResumeContent())
                .resumeSummary(candidate.getResumeSummary())
                .build();
    }

    private JobDto mapToJobDto(Job job) {
        return JobDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .department(job.getDepartment())
                .location(job.getLocation())
                .build();
    }






    /**
     * Maps a CandidateJob entity to a detailed DTO including all related information
     */
    private CandidateJobDetailDto mapToCandidateJobDetailDto(CandidateJob candidateJob) {
        // Map candidate details
        CandidateDto candidateDto = CandidateDto.builder()
                .id(candidateJob.getCandidate().getId())
                .fullName(candidateJob.getCandidate().getFullName())
                .email(candidateJob.getCandidate().getEmail())
                .phoneNumber(candidateJob.getCandidate().getPhoneNumber())
                .resumeContent(candidateJob.getCandidate().getResumeContent())
                .resumeSummary(candidateJob.getCandidate().getResumeSummary())
                .build();

        // Map job details
        JobDto jobDto = JobDto.builder()
                .id(candidateJob.getJob().getId())
                .title(candidateJob.getJob().getTitle())
                .department(candidateJob.getJob().getDepartment())
                .location(candidateJob.getJob().getLocation())
                .build();

        // Map interview details
        List<InterviewDetailDto> interviewDtos = candidateJob.getInterviews().stream()
                .map(this::mapToInterviewDetailDto)
                .collect(Collectors.toList());

        // Build and return the complete DTO
        return CandidateJobDetailDto.builder()
                .id(candidateJob.getId())
                .candidate(candidateDto)
                .job(jobDto)
                .currentRound(candidateJob.getCurrentRound())
                .status(candidateJob.getStatus())
                .interviews(interviewDtos)
                .build();
    }

    /**
     * Maps an Interview entity to a detailed DTO
     */
    private InterviewDetailDto mapToInterviewDetailDto(Interview interview) {
        // Map interviewers
        List<InterviewerDto> interviewerDtos = interview.getInterviewers().stream()
                .map(ii -> InterviewerDto.builder()
                        .userId(ii.getId().getUserId())
                        .name(ii.getName())
                        .email(ii.getEmail())
                        .build())
                .collect(Collectors.toList());

        // Map feedback templates
        List<String> feedbackTemplates = interview.getFeedbackTemplates().stream()
                .map(FeedbackTemplate::getTemplate)
                .collect(Collectors.toList());

        // Build and return the interview detail DTO
        return InterviewDetailDto.builder()
                .interviewId(interview.getInterviewId())
                .roundNumber(interview.getRoundNumber())
                .interviewDate(interview.getInterviewDate())
                .position(interview.getPosition())
                .status(interview.getStatus())
                .mode(interview.getMode())
                .meetingLink(interview.getMeetingLink())
                .testId(interview.getTestId())
                .createdAt(interview.getCreatedAt())
                .resumeContent(interview.getResumeContent())
                .resumeSummary(interview.getResumeSummary())
                .interviewers(interviewerDtos)
//                .feedbackTemplates(feedbackTemplates)
//                .feedback(interview.getFeedback())
                .build();
    }

    // Custom exception for resource not found
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}