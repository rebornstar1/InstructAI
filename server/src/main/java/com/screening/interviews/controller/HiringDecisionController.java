package com.screening.interviews.controller;

import com.screening.interviews.dto.HiringDecisionDto;
import com.screening.interviews.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hiring")
@RequiredArgsConstructor
public class HiringDecisionController {

    private final InterviewService interviewService;

    @PostMapping("/hire")
    public ResponseEntity<String> hireCandidate(@RequestBody HiringDecisionDto dto) {
        // For hire, email is always sent.
        interviewService.hireCandidateDecision(dto.getInterviewId(), dto.getEmailContent());
        return ResponseEntity.ok("Candidate hired successfully.");
    }

    @PostMapping("/reject")
    public ResponseEntity<String> rejectCandidate(@RequestBody HiringDecisionDto dto) {
        // For reject, email sending is optional.
        interviewService.rejectCandidateDecision(dto.getInterviewId(), dto.isSendEmail(), dto.getEmailContent());
        return ResponseEntity.ok("Candidate rejected successfully.");
    }
}