package com.screening.interviews.controller;

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

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final UserService userService;
    private final UserModuleProgressRepository userModuleProgressRepository;

    /**
     * Enroll the current user in a course
     */
    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<CourseProgressDto> enrollInCourse(@PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();
        UserCourseProgress progress = progressService.enrollInCourse(currentUser.getId(), courseId);
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
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<CourseProgressDto> getCourseProgress(@PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();
        UserCourseProgress progress = progressService.getCourseProgress(currentUser.getId(), courseId);
        return ResponseEntity.ok(CourseProgressDto.fromEntity(progress));
    }

    /**
     * Get progress for a specific module
     */
    @GetMapping("/modules/{moduleId}")
    public ResponseEntity<ModuleProgressDto> getModuleProgress(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.getModuleProgress(currentUser.getId(), moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Start a module (mark as in progress)
     */
    @PostMapping("/modules/{moduleId}/start")
    public ResponseEntity<ModuleProgressDto> startModule(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.startModule(currentUser.getId(), moduleId);
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Mark a submodule as completed
     */
    @PostMapping("/submodules/complete")
    public ResponseEntity<ModuleProgressDto> completeSubmodule(@RequestBody SubmoduleCompletionDto request) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeSubmodule(
                currentUser.getId(), request.getModuleId(), request.getSubmoduleId());
        return ResponseEntity.ok(ModuleProgressDto.fromEntity(progress));
    }

    /**
     * Complete a quiz with a score
     */
    @PostMapping("/quiz/complete")
    public ResponseEntity<ModuleProgressDto> completeQuiz(@RequestBody QuizCompletionDto request) {
        User currentUser = userService.getCurrentUser();
        UserModuleProgress progress = progressService.completeQuiz(
                currentUser.getId(), request.getModuleId(), request.getScore());
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
    @GetMapping("/modules/{moduleId}/access")
    public ResponseEntity<Boolean> canAccessModule(@PathVariable Long moduleId) {
        User currentUser = userService.getCurrentUser();
        boolean canAccess = progressService.canAccessModule(currentUser.getId(), moduleId);
        return ResponseEntity.ok(canAccess);
    }

    @GetMapping("/courses/{courseId}/modules")
    public ResponseEntity<List<ModuleProgressDto>> getModuleProgressByCourse(
            @PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();

        // Update this line to use the corrected method name
        List<UserModuleProgress> progressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(currentUser.getId(), courseId);

        List<ModuleProgressDto> dtoList = progressList.stream()
                .map(ModuleProgressDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }
}