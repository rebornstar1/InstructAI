package com.screening.interviews.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.screening.interviews.dto.AIAnalysisResponseDto;
import com.screening.interviews.dto.FeedbackResponseDto;
import com.screening.interviews.dto.UpdateFeedbackDto;
import com.screening.interviews.dto.CreateFeedbackDto;
import com.screening.interviews.mapper.FeedbackMapper;
import com.screening.interviews.model.Feedback;
import com.screening.interviews.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@Valid @RequestBody CreateFeedbackDto dto) {
        Feedback feedback = feedbackService.createFeedback(dto);
        return ResponseEntity.ok(feedback);
    }

    @GetMapping
    public ResponseEntity<List<FeedbackResponseDto>> getAllFeedback() {
        List<Feedback> feedbackList = feedbackService.getAllFeedback();
        List<FeedbackResponseDto> feedbackDTOList = FeedbackMapper.toDTOList(feedbackList);
        return ResponseEntity.ok(feedbackDTOList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponseDto> getFeedbackById(@PathVariable("id") Long id) {
        Feedback feedback = feedbackService.getFeedbackById(id);
        FeedbackResponseDto feedbackDto = FeedbackMapper.toDTO(feedback);
        return ResponseEntity.ok(feedbackDto);
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<List<FeedbackResponseDto>> getFeedbackByInterviewId(@PathVariable Long interviewId) {
        List<Feedback> feedbackList = feedbackService.getFeedbackByInterviewId(interviewId);
        List<FeedbackResponseDto> feedbackDTOList = FeedbackMapper.toDTOList(feedbackList);
        return ResponseEntity.ok(feedbackDTOList);
    }


    @PutMapping("/{id}")
    public ResponseEntity<Feedback> updateFeedback(@PathVariable("id") Long id,
                                                   @Valid @RequestBody UpdateFeedbackDto dto) {
        Feedback updatedFeedback = feedbackService.updateFeedback(id, dto);
        return ResponseEntity.ok(updatedFeedback);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable("id") Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analysis/candidate/{candidateJobId}")
    public ResponseEntity<AIAnalysisResponseDto> getCandidateAnalysis(@PathVariable Long candidateJobId) {
        AIAnalysisResponseDto analysis = feedbackService.generateCandidateAnalysis(candidateJobId);
        return ResponseEntity.ok(analysis);
    }
}
