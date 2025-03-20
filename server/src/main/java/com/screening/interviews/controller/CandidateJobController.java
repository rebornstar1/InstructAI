package com.screening.interviews.controller;

import com.screening.interviews.dto.InterviewDtos.CandidateJobDetailDto;
import com.screening.interviews.service.CandidateJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.screening.interviews.dto.InterviewDtos.CandidateJobSummaryDto;


import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidate-jobs")
@RequiredArgsConstructor
public class CandidateJobController {

    private final CandidateJobService candidateJobService;

    @GetMapping("/{id}")
    public ResponseEntity<CandidateJobDetailDto> getCandidateJobById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateJobService.getCandidateJobDetails(id));
    }

    @GetMapping("/candidate/{candidateId}/job/{jobId}")
    public ResponseEntity<CandidateJobDetailDto> getCandidateJobByCandidateAndJob(
            @PathVariable Long candidateId,
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(candidateJobService.getCandidateJobDetailsByCandidateAndJob(candidateId, jobId));
    }

    @GetMapping("/candidate/email/{email}/job/{jobId}")
    public ResponseEntity<CandidateJobDetailDto> getCandidateJobByEmailAndJob(
            @PathVariable String email,
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(candidateJobService.getCandidateJobDetailsByEmailAndJob(email, jobId));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<CandidateJobSummaryDto>> getCandidatesByJobId(
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(candidateJobService.getCandidatesByJobId(jobId));
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<CandidateJobSummaryDto>> getJobsByCandidateId(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateJobService.getJobsByCandidateId(candidateId));
    }


}
