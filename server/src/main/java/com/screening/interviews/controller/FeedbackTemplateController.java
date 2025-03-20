package com.screening.interviews.controller;

import com.screening.interviews.model.FeedbackTemplate;
import com.screening.interviews.service.FeedbackTemplateService;
import com.screening.interviews.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback-templates")
public class FeedbackTemplateController {

    private final FeedbackTemplateService feedbackTemplateService;

    @Autowired
    public FeedbackTemplateController(FeedbackTemplateService feedbackTemplateService) {
        this.feedbackTemplateService = feedbackTemplateService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeedbackTemplate> getFeedbackTemplateById(@PathVariable Long id) {
        return feedbackTemplateService.getFeedbackTemplateById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("FeedbackTemplate not found with id: " + id));
    }
}
