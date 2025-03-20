package com.screening.interviews.controller;

import com.screening.interviews.dto.AddInterviewerDto;
import com.screening.interviews.dto.CreateInterviewDto;
import com.screening.interviews.dto.InterviewResponseDto;
import com.screening.interviews.dto.UpdateInterviewDto;
import com.screening.interviews.enums.InterviewStatus;
import com.screening.interviews.service.InterviewService;
import com.screening.interviews.model.Interview;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*")
@Slf4j
public class InterviewController {

    private final InterviewService interviewService;

    @Autowired
    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping
    public ResponseEntity<InterviewResponseDto> createInterview(@Valid @RequestBody CreateInterviewDto dto) {
        log.info("Received createInterview request: {}", dto);
        InterviewResponseDto interview = interviewService.createInterview(dto);
        return ResponseEntity.ok(interview);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllInterviews() {
        log.info("Received getAllInterviews request");
        return ResponseEntity.ok(interviewService.getAllInterviews());
    }


    @GetMapping("/{id}")
    public ResponseEntity<InterviewResponseDto> getInterviewById(@PathVariable("id") Long id) {
        InterviewResponseDto interview = interviewService.getInterviewById(id);
        return ResponseEntity.ok(interview);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable("id") Long id) {
        interviewService.deleteInterview(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/interviewers")
    public Void addInterviewer(
            @PathVariable("id") Long interviewId,
            @Valid @RequestBody AddInterviewerDto dto) {
        interviewService.addInterviewer(interviewId, dto);
        return null;
    }

    @DeleteMapping("/{id}/interviewers/{userId}")
    public Void removeInterviewer(
            @PathVariable("id") Long interviewId,
            @PathVariable("userId") Long userId) {
        interviewService.removeInterviewer(interviewId, userId);
        return null;
    }

    // File: src/main/java/com/screening/interviews/controller/InterviewController.java

    @PutMapping("/{id}/status")
    public ResponseEntity<InterviewResponseDto> updateInterviewStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") InterviewStatus status) {
        log.info("Received updateInterviewStatus request for id: {} with status: {}", id, status);

        // Validate the status
        if (status != InterviewStatus.SCHEDULED &&
                status != InterviewStatus.COMPLETED_COMPLETED &&
                status != InterviewStatus.COMPLETED_OVERDUE &&
                status != InterviewStatus.CANCELLED) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        InterviewResponseDto updatedInterview = interviewService.updateInterviewStatus(id, status);
        return ResponseEntity.ok(updatedInterview);
    }


}