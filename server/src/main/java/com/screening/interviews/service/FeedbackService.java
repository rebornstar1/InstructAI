package com.screening.interviews.service;

import com.screening.interviews.dto.AIAnalysisResponseDto;
import com.screening.interviews.dto.CreateFeedbackDto;
import com.screening.interviews.dto.FeedbackResponseDto;
import com.screening.interviews.dto.UpdateFeedbackDto;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.mapper.FeedbackMapper;
import com.screening.interviews.model.*;
import com.screening.interviews.enums.Recommendation;
import com.screening.interviews.repo.CandidateJobRepository;
import com.screening.interviews.repo.FeedbackRepository;
import com.screening.interviews.repo.InterviewRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final InterviewRepository interviewRepository;
    private final CandidateJobRepository candidateJobRepository;
    private final AIFeedbackService aiFeedbackService;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository,
                           InterviewRepository interviewRepository, CandidateJobRepository candidateJobRepository, AIFeedbackService aiFeedbackService) {
        this.feedbackRepository = feedbackRepository;
        this.interviewRepository = interviewRepository;
        this.candidateJobRepository = candidateJobRepository;
        this.aiFeedbackService = aiFeedbackService;
    }

    public Feedback createFeedback(CreateFeedbackDto dto) {
        Optional<Interview> optionalInterview = interviewRepository.findById(dto.getInterviewId());
        if (!optionalInterview.isPresent()) {
            throw new RuntimeException("Interview not found with id: " + dto.getInterviewId());
        }
        Interview interview = optionalInterview.get();
        Feedback feedback = Feedback.builder()
                .interview(interview)
                .interviewerId(dto.getInterviewerId())
                // Now the builder method 'feedbackData' is available.
                .feedbackData(dto.getFeedbackData())
                .recommendation(dto.getRecommendation() != null ? dto.getRecommendation() : Recommendation.PROCEED)
                .build();
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Feedback getFeedbackById(Long id) {
        Optional<Feedback> optionalFeedback = feedbackRepository.findById(id);
        if (!optionalFeedback.isPresent()) {
            throw new RuntimeException("Feedback not found with id: " + id);
        }
        return optionalFeedback.get();
    }

    public List<Feedback> getFeedbackByInterviewId(Long interviewId) {
        return feedbackRepository.findByInterviewInterviewId(interviewId);
    }

    public Feedback updateFeedback(Long id, UpdateFeedbackDto dto) {
        Feedback feedback = getFeedbackById(id);
        if (dto.getRecommendation() != null) {
            feedback.setRecommendation(dto.getRecommendation());
        }
        if (dto.getFeedbackData() != null) {
            // Replace the entire feedbackData map. Optionally, you can merge the maps.
            feedback.setFeedbackData(dto.getFeedbackData());
        }
        return feedbackRepository.save(feedback);
    }

    public void deleteFeedback(Long id) {
        Feedback feedback = getFeedbackById(id);
        feedbackRepository.delete(feedback);
    }

    public AIAnalysisResponseDto generateCandidateAnalysis(Long candidateJobId) {
        // Fetch candidate job data
        CandidateJob candidateJob = candidateJobRepository.findById(candidateJobId)
                .orElseThrow(() -> new ResourceNotFoundException("CandidateJob not found here"));
        // Get candidate details
        Candidate candidate = candidateJob.getCandidate();
        String resume = candidate.getResumeContent();

        // Get job details
        Job job = candidateJob.getJob();
        String jobDescription = job.getDescription();

        // Get all feedback for this candidate's interviews
        List<Feedback> feedbackList = new ArrayList<>();
        for (Interview interview : candidateJob.getInterviews()) {
            feedbackList.addAll(getFeedbackByInterviewId(interview.getInterviewId()));
        }
        List<FeedbackResponseDto> feedbackDtos = FeedbackMapper.toDTOList(feedbackList);

        log.info("Generating AI analysis for candidate: {}", candidateJobId);
        log.info("Candidate: {}", candidate);
        log.info("Job: {}", job);
        log.info("Feedback: {}", feedbackDtos);

        // Since we've removed the throws declaration, we don't need to handle the exception here
        return aiFeedbackService.generateCandidateAnalysis(jobDescription, resume, feedbackDtos);
    }
}
