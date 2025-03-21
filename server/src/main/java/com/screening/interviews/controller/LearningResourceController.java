package com.screening.interviews.controller;

import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.service.LearningResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learning-resources")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LearningResourceController {

    private final LearningResourceService learningResourceService;

    @PostMapping("/generate")
    public ResponseEntity<LearningResourceDto> generateLearningResource(@RequestBody LearningResourceRequestDto request) {
        LearningResourceDto resource = learningResourceService.generateLearningResource(request);
        return ResponseEntity.ok(resource);
    }
}
