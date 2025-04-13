package com.screening.interviews.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.*;
import com.screening.interviews.model.User;
import com.screening.interviews.model.UserCourseProgress;
import com.screening.interviews.model.UserModuleProgress;
import com.screening.interviews.repo.QuizRepository;
import com.screening.interviews.repo.UserModuleProgressRepository;
import com.screening.interviews.service.ProgressService;
import com.screening.interviews.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressService progressService;
    private final UserService userService;
    private final UserModuleProgressRepository userModuleProgressRepository;
    private final ObjectMapper objectMapper;

    /**
     * Enroll the current user in a course
     */
    @PostMapping("/enroll")
    public ResponseEntity<CourseProgressDto> enrollInCourse(@RequestBody CourseEnrollmentDto request) {
        User currentUser = userService.getCurrentUser();
        UserCourseProgress progress = progressService.enrollInCourse(currentUser.getId(), request.getCourseId());
        return ResponseEntity.ok(CourseProgressDto.fromEntity(progress));
    }

    /**
     * Get all course progress for the current user
     */
    @GetMapping("/courses")
    public ResponseEntity<List<CourseProgressDto>> getAllCourseProgress() {
        User currentUser = userService.getCurrentUser();
        List<UserCourseProgress> progressList = progressService.getAllCourseProgress(currentUser.getId());

        List<CourseProgressDto> dtoList = progressList.stream()
                .map(CourseProgressDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    /**
     * Get progress for a specific course
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<CourseProgressDto> getCourseProgress(@PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();
        UserCourseProgress progress = progressService.getCourseProgress(currentUser.getId(), courseId);
        return ResponseEntity.ok(CourseProgressDto.fromEntity(progress));
    }

    /**
     * Get detailed course progress with module progress map
     */
    @GetMapping("/course/{courseId}/detailed")
    public ResponseEntity<Map<String, Object>> getCourseWithAllProgress(@PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();
        Map<String, Object> progressData = progressService.getCourseWithAllProgress(
                currentUser.getId(), courseId);

        return ResponseEntity.ok(progressData);
    }

    /**
     * Get progress for a specific module
     */
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<ModuleProgressDto> getModuleProgress(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.getModuleProgress(currentUser.getId(), moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Start a module (mark as in progress)
     */
    @PostMapping("/module/{moduleId}/start")
    public ResponseEntity<ModuleProgressDto> startModule(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.startModule(currentUser.getId(), moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Get key term progress for a module
     */
    @GetMapping("/module/{moduleId}/terms")
    public ResponseEntity<List<KeyTermProgressDto>> getKeyTermProgress(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        List<KeyTermProgressDto> keyTermProgress = progressService.getKeyTermProgress(
                currentUser.getId(), moduleId);
        return ResponseEntity.ok(keyTermProgress);
    }

    /**
     * Set active term for a module
     */
    @PostMapping("/module/{moduleId}/terms/{termIndex}/activate")
    public ResponseEntity<ModuleProgressDto> setActiveTerm(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.setActiveTerm(
                currentUser.getId(), moduleId, termIndex);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Complete a key term
     */
    @PostMapping("/module/{moduleId}/terms/{termIndex}/complete")
    public ResponseEntity<Map<String, Object>> completeKeyTerm(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeKeyTerm(
                currentUser.getId(), moduleId, termIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("termCompleted", true);
        response.put("moduleId", moduleId);
        response.put("termIndex", termIndex);
        response.put("progressPercentage", progress.getProgressPercentage());

        // Check if next term is unlocked
        Integer nextTermIndex = termIndex + 1;
        boolean nextTermUnlocked = progress.isTermUnlocked(nextTermIndex);
        response.put("nextTermUnlocked", nextTermUnlocked);
        response.put("nextTermIndex", nextTermUnlocked ? nextTermIndex : null);

        // Check if module is completed
        boolean moduleCompleted = progress.getState() == UserModuleProgress.ModuleState.COMPLETED;
        response.put("moduleCompleted", moduleCompleted);

        return ResponseEntity.ok(response);
    }

    /**
     * Save term resources
     */
    @PostMapping("/module/{moduleId}/terms/{termIndex}/resources")
    public ResponseEntity<ModuleProgressDto> saveTermResources(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @RequestBody Map<String, Object> resources) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.saveTermResources(
                currentUser.getId(), moduleId, termIndex, resources);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Update term resource completion status
     */
    @PostMapping("/module/{moduleId}/terms/{termIndex}/resources/{resourceType}/complete")
    public ResponseEntity<Map<String, Object>> completeTermResource(
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @PathVariable String resourceType) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.updateTermResourceCompletion(
                currentUser.getId(), moduleId, termIndex, resourceType);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("resourceType", resourceType);
        response.put("moduleId", moduleId);
        response.put("termIndex", termIndex);

        // Check if the term was automatically completed
        boolean termCompleted = progress.isTermCompleted(termIndex);
        response.put("termCompleted", termCompleted);

        if (termCompleted) {
            // If term was completed, include info about next term
            Integer nextTermIndex = termIndex + 1;
            boolean nextTermUnlocked = progress.isTermUnlocked(nextTermIndex);
            response.put("nextTermUnlocked", nextTermUnlocked);
            response.put("nextTermIndex", nextTermUnlocked ? nextTermIndex : null);
        }

        // Include module progress
        response.put("moduleProgress", progress.getProgressPercentage());
        response.put("moduleState", progress.getState().name());

        return ResponseEntity.ok(response);
    }

    /**
     * Mark a submodule as completed
     */
    @PostMapping("/module/{moduleId}/submodule/{submoduleId}/complete")
    public ResponseEntity<ModuleProgressDto> completeSubmodule(
            @PathVariable Long moduleId,
            @PathVariable Long submoduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeSubmodule(
                currentUser.getId(), moduleId, submoduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Mark a video as completed
     */
    @PostMapping("/module/{moduleId}/video/{videoId}/complete")
    public ResponseEntity<ModuleProgressDto> completeVideo(
            @PathVariable Long moduleId,
            @PathVariable String videoId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeVideo(
                currentUser.getId(), moduleId, videoId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Complete a quiz with a score
     */
    @PostMapping("/module/{moduleId}/quiz/{quizId}/complete")
    public ResponseEntity<ModuleProgressDto> completeQuiz(
            @PathVariable Long moduleId,
            @PathVariable Long quizId,
            @RequestBody QuizCompletionDto request) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeQuiz(
                currentUser.getId(), moduleId, request.getScore());
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Get a summary of the user's progress
     */
    @GetMapping("/summary")
    public ResponseEntity<UserProgressSummaryDto> getUserProgressSummary() {
        User currentUser = userService.getCurrentUser();
        Long userId = currentUser.getId();

        List<UserCourseProgress> allProgress = progressService.getAllCourseProgress(userId);

        int totalCourses = allProgress.size();
        int coursesInProgress = 0;
        int coursesCompleted = 0;

        for (UserCourseProgress progress : allProgress) {
            if (progress.getState() == UserCourseProgress.ProgressState.COMPLETED) {
                coursesCompleted++;
            } else if (progress.getState() == UserCourseProgress.ProgressState.IN_PROGRESS) {
                coursesInProgress++;
            }
        }

        // Get recent courses (up to 5, ordered by last accessed)
        List<CourseProgressDto> recentCourses = allProgress.stream()
                .sorted((p1, p2) -> {
                    if (p1.getLastAccessedAt() == null) return 1;
                    if (p2.getLastAccessedAt() == null) return -1;
                    return p2.getLastAccessedAt().compareTo(p1.getLastAccessedAt());
                })
                .limit(5)
                .map(CourseProgressDto::fromEntity)
                .collect(Collectors.toList());

        UserProgressSummaryDto summary = UserProgressSummaryDto.builder()
                .totalCourses(totalCourses)
                .coursesInProgress(coursesInProgress)
                .coursesCompleted(coursesCompleted)
                .totalModulesCompleted(progressService.getCompletedModulesCount(userId))
                .totalXP(currentUser.getXp())
                .recentCourses(recentCourses)
                .build();

        return ResponseEntity.ok(summary);
    }

    /**
     * Check if a user can access a module
     */
    @GetMapping("/module/{moduleId}/access")
    public ResponseEntity<Boolean> canAccessModule(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        boolean canAccess = progressService.canAccessModule(currentUser.getId(), moduleId);
        return ResponseEntity.ok(canAccess);
    }

    /**
     * Get module progress for a course
     */
    @GetMapping("/course/{courseId}/modules")
    public ResponseEntity<List<ModuleProgressDto>> getModuleProgressByCourse(
            @PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();

        List<UserModuleProgress> progressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(currentUser.getId(), courseId);

        List<ModuleProgressDto> dtoList = progressList.stream()
                .map(ModuleProgressDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    /**
     * Recalculate module progress
     */
    @PostMapping("/module/{moduleId}/recalculate")
    public ResponseEntity<ModuleProgressDto> recalculateModuleProgress(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.recalculateModuleProgress(
                currentUser.getId(), moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Reset module progress (admin only)
     */
    @PostMapping("/module/{moduleId}/reset")
    public ResponseEntity<ModuleProgressDto> resetModuleProgress(
            @PathVariable Long moduleId,
            @RequestParam Long userId) {
        // In a real app, add security check to ensure only admins can call this
        UserModuleProgress progress = progressService.resetModuleProgress(userId, moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    @PostMapping("/modules/{moduleId}/update-total-submodules")
    public ResponseEntity<Map<String, Object>> updateTotalSubmodules(@PathVariable Long moduleId) {
        int updatedCount = progressService.updateTotalSubmodules(moduleId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("moduleId", moduleId);
        response.put("updatedRecords", updatedCount);
        response.put("message", "Successfully updated total submodules count for " + updatedCount + " progress records");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/modules/{moduleId}/submodules/{submoduleId}/complete")
    public ResponseEntity<Map<String, Object>> completeSubmodule(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @PathVariable Long submoduleId) {

        // Complete the submodule using existing service
        UserModuleProgress progress = progressService.completeSubmodule(userId, moduleId, submoduleId);

        // Check if this completion triggers module completion
        UserModuleProgress updatedProgress = progressService.checkAndCompleteModule(userId, moduleId);

        boolean moduleAutoCompleted = updatedProgress != null &&
                updatedProgress.getState() == UserModuleProgress.ModuleState.COMPLETED;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("submoduleCompleted", true);
        response.put("moduleId", moduleId);
        response.put("moduleProgress", progress.getProgressPercentage());
        response.put("moduleAutoCompleted", moduleAutoCompleted);

        return ResponseEntity.ok(response);
    }

    /**
     * Record completion of a quiz and automatically check for module completion
     */
    @PostMapping("/users/{userId}/modules/{moduleId}/quiz/complete")
    public ResponseEntity<Map<String, Object>> completeQuiz(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @RequestParam int score) {

        // Complete the quiz using existing service
        UserModuleProgress progress = progressService.completeQuiz(userId, moduleId, score);

        // Check if this completion triggers module completion
        UserModuleProgress updatedProgress = progressService.checkAndCompleteModule(userId, moduleId);

        boolean moduleAutoCompleted = updatedProgress != null &&
                updatedProgress.getState() == UserModuleProgress.ModuleState.COMPLETED;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("quizCompleted", true);
        response.put("score", score);
        response.put("moduleId", moduleId);
        response.put("moduleProgress", progress.getProgressPercentage());
        response.put("moduleAutoCompleted", moduleAutoCompleted);

        return ResponseEntity.ok(response);
    }

    /**
     * Record completion of a video and automatically check for module completion
     */
    @PostMapping("/users/{userId}/modules/{moduleId}/videos/{videoId}/complete")
    public ResponseEntity<Map<String, Object>> completeVideo(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @PathVariable String videoId) {

        // Complete the video using existing service
        UserModuleProgress progress = progressService.completeVideo(userId, moduleId, videoId);

        // Check if this completion triggers module completion
        UserModuleProgress updatedProgress = progressService.checkAndCompleteModule(userId, moduleId);

        boolean moduleAutoCompleted = updatedProgress != null &&
                updatedProgress.getState() == UserModuleProgress.ModuleState.COMPLETED;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("videoCompleted", true);
        response.put("moduleId", moduleId);
        response.put("moduleProgress", progress.getProgressPercentage());
        response.put("moduleAutoCompleted", moduleAutoCompleted);

        return ResponseEntity.ok(response);
    }

    /**
     * Generate content for a term and link it to progress
     */
    @PostMapping("/users/{userId}/modules/{moduleId}/terms/{termIndex}/generate")
    public ResponseEntity<Map<String, Object>> generateTermContent(
            @PathVariable Long userId,
            @PathVariable Long moduleId,
            @PathVariable Integer termIndex,
            @RequestBody Map<String, Object> contentMetadata) {

        // Save the content metadata for this term
        UserModuleProgress progress = progressService.saveTermResources(
                userId, moduleId, termIndex, contentMetadata);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("moduleId", moduleId);
        response.put("termIndex", termIndex);
        response.put("contentGenerated", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Manually check if a module should be auto-completed (can be called periodically)
     */
    @PostMapping("/users/{userId}/modules/{moduleId}/check-completion")
    public ResponseEntity<Map<String, Object>> checkModuleCompletion(
            @PathVariable Long userId,
            @PathVariable Long moduleId) {

        UserModuleProgress progress = progressService.checkAndCompleteModule(userId, moduleId);

        boolean moduleAutoCompleted = progress != null &&
                progress.getState() == UserModuleProgress.ModuleState.COMPLETED;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("moduleId", moduleId);
        response.put("moduleAutoCompleted", moduleAutoCompleted);

        if (progress != null) {
            response.put("moduleProgress", progress.getProgressPercentage());
            response.put("moduleState", progress.getState().name());
        }

        return ResponseEntity.ok(response);
    }
}