package com.screening.interviews.controller;

import com.screening.interviews.dto.StepProgressRequestDto;
import com.screening.interviews.model.UserModuleStepProgress;
import com.screening.interviews.service.UserModuleStepProgressService;
import com.screening.interviews.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for handling module step progress tracking
 */
@RestController
@RequestMapping("/api/progress/steps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserModuleStepProgressController {

    private final UserModuleStepProgressService stepProgressService;
    private final UserService userService;

    /**
     * Initialize step progress tracking for a module
     */
    @PostMapping("/modules/{moduleId}/initialize")
    public ResponseEntity<Map<String, Object>> initializeModuleStepProgress(@PathVariable Long moduleId) {
        Long userId = userService.getCurrentUser().getId();
        stepProgressService.initializeModuleStepProgress(userId, moduleId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Step progress initialized for module");
        return ResponseEntity.ok(response);
    }

    /**
     * Get all steps for a module
     */
    @GetMapping("/modules/{moduleId}")
    public ResponseEntity<List<UserModuleStepProgress>> getStepsForModule(@PathVariable Long moduleId) {
        Long userId = userService.getCurrentUser().getId();
        List<UserModuleStepProgress> steps = stepProgressService.getStepsForModule(userId, moduleId);
        return ResponseEntity.ok(steps);
    }

    /**
     * Get all steps for a key term
     */
    @GetMapping("/modules/{moduleId}/terms/{termIndex}")
    public ResponseEntity<List<UserModuleStepProgress>> getStepsForKeyTerm(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {
        Long userId = userService.getCurrentUser().getId();
        List<UserModuleStepProgress> steps = stepProgressService.getStepsForKeyTerm(userId, moduleId, termIndex);
        return ResponseEntity.ok(steps);
    }

    /**
     * Complete an article (submodule)
     */
    @PostMapping("/modules/{moduleId}/articles/{submoduleId}/complete")
    public ResponseEntity<Map<String, Object>> completeArticle(
            @PathVariable Long moduleId,
            @PathVariable Long submoduleId) {
        Long userId = userService.getCurrentUser().getId();
        UserModuleStepProgress step = stepProgressService.completeArticle(userId, moduleId, submoduleId);

        Map<String, Object> response = createSuccessResponse(step);
        return ResponseEntity.ok(response);
    }

    /**
     * Update article reading progress
     */
    @PostMapping("/modules/{moduleId}/articles/{submoduleId}/progress")
    public ResponseEntity<Map<String, Object>> updateArticleProgress(
            @PathVariable Long moduleId,
            @PathVariable Long submoduleId,
            @RequestBody StepProgressRequestDto request) {
        Long userId = userService.getCurrentUser().getId();
        UserModuleStepProgress step = stepProgressService.updateArticleProgress(
                userId, moduleId, submoduleId, request.getPercentage());

        Map<String, Object> response = createSuccessResponse(step);
        return ResponseEntity.ok(response);
    }

    /**
     * Complete a video
     */
    @PostMapping("/modules/{moduleId}/videos/{videoId}/complete")
    public ResponseEntity<Map<String, Object>> completeVideo(
            @PathVariable Long moduleId,
            @PathVariable String videoId) {
        Long userId = userService.getCurrentUser().getId();
        UserModuleStepProgress step = stepProgressService.completeVideo(userId, moduleId, videoId);

        Map<String, Object> response = createSuccessResponse(step);
        return ResponseEntity.ok(response);
    }

    /**
     * Update video watching progress
     */
    @PostMapping("/modules/{moduleId}/videos/{videoId}/progress")
    public ResponseEntity<Map<String, Object>> updateVideoProgress(
            @PathVariable Long moduleId,
            @PathVariable String videoId,
            @RequestBody StepProgressRequestDto request) {
        Long userId = userService.getCurrentUser().getId();
        UserModuleStepProgress step = stepProgressService.updateVideoProgress(
                userId, moduleId, videoId, request.getPercentage());

        Map<String, Object> response = createSuccessResponse(step);
        return ResponseEntity.ok(response);
    }

    /**
     * Complete a quiz with score
     */
    @PostMapping("/modules/{moduleId}/quizzes/{quizId}/complete")
    public ResponseEntity<Map<String, Object>> completeQuiz(
            @PathVariable Long moduleId,
            @PathVariable Long quizId,
            @RequestBody StepProgressRequestDto request) {
        Long userId = userService.getCurrentUser().getId();
        UserModuleStepProgress step = stepProgressService.completeQuiz(userId, moduleId, quizId, request.getScore());

        Map<String, Object> response = createSuccessResponse(step);
        response.put("score", request.getScore());
        return ResponseEntity.ok(response);
    }

    /**
     * Check key term completion status based on completed steps
     */
    @PostMapping("/modules/{moduleId}/terms/{termIndex}/check-completion")
    public ResponseEntity<Map<String, Object>> checkKeyTermCompletion(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {
        Long userId = userService.getCurrentUser().getId();

        // Check if all required steps are completed for this term
        stepProgressService.checkKeyTermCompletion(userId, moduleId, termIndex);

        // Get term completion status
        boolean isTermCompleted = stepProgressService.isKeyTermCompleted(userId, moduleId, termIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("termIndex", termIndex);
        response.put("termCompleted", isTermCompleted);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a standardized success response with relevant information
     */
    private Map<String, Object> createSuccessResponse(UserModuleStepProgress step) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("stepId", step.getId());
        response.put("stepType", step.getStepType().name());
        response.put("status", step.getStatus().name());

        // Include additional information based on step type
        if (step.getKeyTermIndex() != null) {
            response.put("keyTermIndex", step.getKeyTermIndex());

            // Check if the key term is now completed
            boolean termCompleted = stepProgressService.isKeyTermCompleted(
                    step.getUser().getId(), step.getModule().getId(), step.getKeyTermIndex());
            response.put("keyTermCompleted", termCompleted);
        }

        // Include progress percentages for articles and videos
        if (step.getStepType() == UserModuleStepProgress.StepType.ARTICLE && step.getReadProgressPercentage() != null) {
            response.put("readProgressPercentage", step.getReadProgressPercentage());
        } else if (step.getStepType() == UserModuleStepProgress.StepType.VIDEO && step.getWatchProgressPercentage() != null) {
            response.put("watchProgressPercentage", step.getWatchProgressPercentage());
        } else if (step.getStepType() == UserModuleStepProgress.StepType.QUIZ && step.getBestScore() != null) {
            response.put("bestScore", step.getBestScore());
        }

        return response;
    }
}