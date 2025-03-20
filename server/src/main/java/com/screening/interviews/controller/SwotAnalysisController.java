package com.screening.interviews.controller;

import com.screening.interviews.dto.SwotAnalysisRequestDto;
import com.screening.interviews.dto.SwotAnalysisResponseDto;
import com.screening.interviews.service.SwotAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class SwotAnalysisController {

    private final SwotAnalysisService swotAnalysisService;

    @PostMapping("/swot-analysis")
    public ResponseEntity<SwotAnalysisResponseDto> generateSwotAnalysis(@RequestBody SwotAnalysisRequestDto request) {
        log.info("Received request to generate SWOT analysis for candidate: {}, position: {}",
                request.getCandidateName(), request.getPosition());

        SwotAnalysisResponseDto response = swotAnalysisService.generateSwotAnalysis(request);

        return ResponseEntity.ok(response);
    }
}