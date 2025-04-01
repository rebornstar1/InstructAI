package com.screening.interviews.controller;

import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.dto.InteractiveQuestionDto;
import com.screening.interviews.dto.InteractiveResponseDto;
import com.screening.interviews.service.InteractiveCourseService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for handling interactive course creation via a multi-step question flow
 */
@RestController
@RequestMapping("/api/courses/simplified/interactive")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InteractiveCourseController {

    private static final Logger logger = LoggerFactory.getLogger(InteractiveCourseController.class);

    private final InteractiveCourseService interactiveCourseService;

    /**
     * Start a new interactive course creation session
     * @param request Map containing 'topic' field with the desired course topic
     * @return First set of questions to ask the user
     */
    @PostMapping("/start")
    public ResponseEntity<InteractiveQuestionDto> startInteractiveSession(@RequestBody Map<String, String> request) {
        logger.info("Starting interactive course session for topic: {}", request.get("topic"));

        String topic = request.get("topic");
        if (topic == null || topic.trim().isEmpty()) {
            throw new IllegalArgumentException("Topic is required to start an interactive session");
        }

        InteractiveQuestionDto questions = interactiveCourseService.startInteractiveSession(topic);
        return ResponseEntity.ok(questions);
    }

    /**
     * Process user's answers and get the next set of questions or completion status
     * @param sessionId The session identifier from the start call
     * @param answers Map of question IDs to selected answers
     * @return Next questions or completion status
     */
    @PostMapping("/continue")
    public ResponseEntity<InteractiveResponseDto> continueInteractiveSession(
            @RequestParam String sessionId,
            @RequestBody Map<String, String> answers) {

        logger.info("Continuing interactive session {} with {} answers", sessionId, answers.size());

        InteractiveResponseDto response = interactiveCourseService.processUserAnswers(sessionId, answers);
        return ResponseEntity.ok(response);
    }

    /**
     * Generate the final course based on all answers collected during the interactive session
     * @param sessionId The session identifier
     * @return The generated course
     */
    @PostMapping("/finalize")
    public ResponseEntity<CourseResponseDto> finalizeInteractiveCourse(@RequestParam String sessionId) {
        logger.info("Finalizing interactive course for session: {}", sessionId);

        CourseResponseDto course = interactiveCourseService.generateInteractiveCourse(sessionId);
        return ResponseEntity.ok(course);
    }
}