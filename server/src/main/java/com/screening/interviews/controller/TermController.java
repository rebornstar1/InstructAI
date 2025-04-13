package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.model.UserModuleProgress;
import com.screening.interviews.service.ModuleContentService;
import com.screening.interviews.service.ModuleService;
import com.screening.interviews.service.ProgressService;
import com.screening.interviews.service.UserModuleStepProgressService;
import com.screening.interviews.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/terms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TermController {

    private final ModuleContentService moduleContentService;
    private final ProgressService progressService;
    private final UserModuleStepProgressService stepProgressService;
    private final UserService userService;
    private final ModuleService moduleService;

    /**
     * Get all key terms for a module with progress information
     */
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<ModuleTermsResponseDto> getModuleTermsWithProgress(@PathVariable Long moduleId) {
        // Get current user
        Long userId = userService.getCurrentUser().getId();

        // Get the module
        Module module = moduleService.getModuleById(moduleId);

        // Get module progress
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);

        // Build module terms response
        ModuleTermsResponseDto response = new ModuleTermsResponseDto();
        response.setModuleId(moduleId);
        response.setModuleTitle(module.getTitle());

        // Check if the module has key terms
        if (module.getKeyTerms() == null || module.getKeyTerms().isEmpty()) {
            response.setTermsAvailable(false);
            response.setMessage("No key terms available for this module");
            response.setTerms(new ArrayList<>());
            return ResponseEntity.ok(response);
        }

        // Build term summaries
        List<TermSummaryDto> termSummaries = new ArrayList<>();

        for (int i = 0; i < module.getKeyTerms().size(); i++) {
            String term = module.getKeyTerms().get(i);
            String definition = module.getDefinitions().get(i);

            TermSummaryDto summary = new TermSummaryDto();
            summary.setTerm(term);
            summary.setDefinition(definition);
            summary.setTermIndex(i);
            summary.setUnlocked(progress.isTermUnlocked(i));
            summary.setCompleted(progress.isTermCompleted(i));
            summary.setActive(progress.getActiveTerm() != null && progress.getActiveTerm() == i);

            // Add resource availability and progress
            try {
                Map<String, Object> termResources = progressService.getTermResources(progress, i);

                if (termResources != null) {
                    summary.setArticleAvailable(termResources.containsKey("subModuleId"));
                    summary.setVideoAvailable(termResources.containsKey("videoId"));
                    summary.setQuizAvailable(termResources.containsKey("quizId"));

                    // Set completion status for each resource
                    summary.setArticleCompleted(Boolean.TRUE.equals(termResources.get("articleCompleted")));
                    summary.setVideoCompleted(Boolean.TRUE.equals(termResources.get("videoCompleted")));
                    summary.setQuizCompleted(Boolean.TRUE.equals(termResources.get("quizCompleted")));
                }
            } catch (Exception e) {
                // Ignore errors and default to false
            }

            termSummaries.add(summary);
        }

        response.setTermsAvailable(true);
        response.setTerms(termSummaries);
        response.setActiveTermIndex(progress.getActiveTerm());
        response.setCompletedCount(progress.getCompletedTerms().size());
        response.setTotalCount(module.getKeyTerms().size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get the active term with all its resources
     */
    @GetMapping("/module/{moduleId}/active")
    public ResponseEntity<TermDetailResponseDto> getActiveTermWithResources(@PathVariable Long moduleId) {
        // Get current user
        Long userId = userService.getCurrentUser().getId();

        // Get module progress to find active term
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);
        Integer activeTermIndex = progress.getActiveTerm();

        if (activeTermIndex == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(TermDetailResponseDto.builder()
                            .success(false)
                            .message("No active term found for this module")
                            .build());
        }

        // Get the term details with content
        TermDetailResponseDto response = moduleContentService.getTermDetailsWithProgress(
                userId, moduleId, activeTermIndex);

        return ResponseEntity.ok(response);
    }

    /**
     * Get specific term with all its resources
     */
    @GetMapping("/module/{moduleId}/term/{termIndex}")
    public ResponseEntity<TermDetailResponseDto> getTermWithResources(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {

        Long userId = userService.getCurrentUser().getId();

        // Check if term is unlocked
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);
        if (!progress.isTermUnlocked(termIndex)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(TermDetailResponseDto.builder()
                            .success(false)
                            .message("Term is locked")
                            .build());
        }

        // Get the term details with content
        TermDetailResponseDto response = moduleContentService.getTermDetailsWithProgress(
                userId, moduleId, termIndex);

        return ResponseEntity.ok(response);
    }

    /**
     * Mark a term as active
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/activate")
    public ResponseEntity<ModuleProgressDto> setActiveTerm(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {

        Long userId = userService.getCurrentUser().getId();

        UserModuleProgress progress = progressService.setActiveTerm(userId, moduleId, termIndex);

        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Complete a resource for a term
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/resource/{resourceType}/complete")
    public ResponseEntity<ResourceCompletionResponse> completeResource(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @PathVariable String resourceType) {

        Long userId = userService.getCurrentUser().getId();

        ResourceCompletionResponse response = progressService.completeTermResource(
                userId, moduleId, termIndex, resourceType);

        return ResponseEntity.ok(response);
    }

    /**
     * Update resource progress
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/resource/{resourceType}/progress")
    public ResponseEntity<Map<String, Object>> updateResourceProgress(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @PathVariable String resourceType,
            @RequestBody Map<String, Object> request) {

        Long userId = userService.getCurrentUser().getId();

        // Get progress percentage from request
        int progressPercentage = 0;
        if (request.containsKey("percentage")) {
            progressPercentage = (int) request.get("percentage");
        }

        // Update progress
        progressService.updateResourceProgress(userId, moduleId, termIndex, resourceType, progressPercentage);

        // Build response
        Map<String, Object> response = Map.of(
                "success", true,
                "resourceType", resourceType,
                "progressPercentage", progressPercentage,
                "moduleId", moduleId,
                "termIndex", termIndex
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Update quiz score
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/quiz/{quizId}/complete")
    public ResponseEntity<Map<String, Object>> completeQuiz(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @PathVariable Long quizId,
            @RequestBody QuizCompletionDto request) {

        Long userId = userService.getCurrentUser().getId();

        // Update quiz score
        progressService.updateQuizScore(userId, moduleId, termIndex, quizId, request.getScore());

        // Check if completing the quiz also completed the term
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);
        boolean termCompleted = progress.isTermCompleted(termIndex);

        // Check if next term was unlocked
        Integer nextTermIndex = termIndex + 1;
        boolean nextTermUnlocked = false;

        if (nextTermIndex < progress.getModule().getKeyTerms().size()) {
            nextTermUnlocked = progress.isTermUnlocked(nextTermIndex);
        }

        // Build response
        Map<String, Object> response = Map.of(
                "success", true,
                "resourceType", "quiz",
                "quizId", quizId,
                "score", request.getScore(),
                "termCompleted", termCompleted,
                "nextTermUnlocked", nextTermUnlocked,
                "nextTermIndex", nextTermUnlocked ? nextTermIndex : null,
                "moduleProgress", progress.getProgressPercentage(),
                "moduleCompleted", progress.getState().name().equals("COMPLETED")
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Manually check if a term is completed
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/check-completion")
    public ResponseEntity<Map<String, Object>> checkTermCompletion(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {

        Long userId = userService.getCurrentUser().getId();

        // Get term resources to check completion status
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);
        Map<String, Object> termResources = progressService.getTermResources(progress, termIndex);

        // Check if all resources are completed
        boolean allCompleted = progressService.checkAllResourcesCompleted(termResources);

        // If all resources are completed and term is not marked as completed yet, complete it
        boolean termWasCompleted = false;
        if (allCompleted && !progress.isTermCompleted(termIndex)) {
            progressService.completeKeyTerm(userId, moduleId, termIndex);
            termWasCompleted = true;

            // Refresh progress after completion
            progress = progressService.getModuleProgress(userId, moduleId);
        }

        // Check if next term was unlocked
        Integer nextTermIndex = termIndex + 1;
        boolean nextTermUnlocked = false;

        if (progress.getModule().getKeyTerms() != null &&
                nextTermIndex < progress.getModule().getKeyTerms().size()) {
            nextTermUnlocked = progress.isTermUnlocked(nextTermIndex);
        }

        // Build response
        Map<String, Object> response = Map.of(
                "success", true,
                "termIndex", termIndex,
                "allResourcesCompleted", allCompleted,
                "termCompleted", progress.isTermCompleted(termIndex),
                "termWasJustCompleted", termWasCompleted,
                "nextTermUnlocked", nextTermUnlocked,
                "nextTermIndex", nextTermUnlocked ? nextTermIndex : null,
                "moduleProgress", progress.getProgressPercentage()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Generate resources for a term if they don't already exist
     */
    @PostMapping("/module/{moduleId}/term/{termIndex}/generate")
    public ResponseEntity<TermDetailResponseDto> generateTermResources(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {

        Long userId = userService.getCurrentUser().getId();

        // Check if term is unlocked
        UserModuleProgress progress = progressService.getModuleProgress(userId, moduleId);
        if (!progress.isTermUnlocked(termIndex)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(TermDetailResponseDto.builder()
                            .success(false)
                            .message("Term is locked")
                            .build());
        }

        // Get module to access key terms
        Module module = moduleService.getModuleById(moduleId);

        // Validate term index
        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            return ResponseEntity.badRequest()
                    .body(TermDetailResponseDto.builder()
                            .success(false)
                            .message("Invalid term index")
                            .build());
        }

        // Get the term and definition
        String term = module.getKeyTerms().get(termIndex);
        String definition = module.getDefinitions().get(termIndex);

        // Generate content for this term
        TermContentRequestDto request = TermContentRequestDto.builder()
                .term(term)
                .definition(definition)
                .moduleId(moduleId)
                .contextTitle(module.getTitle())
                .saveContent(true)
                .build();

        // Generate the content
        TermContentResponseDto generatedContent = moduleContentService.generateTermContent(request);

        // Create step progress entries for these resources
        stepProgressService.initializeModuleStepProgress(userId, moduleId);

        // Return the updated term details
        TermDetailResponseDto response = moduleContentService.getTermDetailsWithProgress(
                userId, moduleId, termIndex);

        return ResponseEntity.ok(response);
    }
}