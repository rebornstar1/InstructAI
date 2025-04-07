package com.screening.interviews.controller;

import com.screening.interviews.dto.ProgressSummaryDto;
import com.screening.interviews.model.User;
import com.screening.interviews.model.UserCourseProgress;
import com.screening.interviews.model.UserModuleProgress;
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
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProgressSummaryController {

    private final ProgressService progressService;
    private final UserService userService;

    /**
     * Get progress summary for the current user
     * Used by the ProgressSummary component
     */
    @GetMapping("/users/{userId}/summary")
    public ResponseEntity<ProgressSummaryDto> getProgressSummary(@PathVariable Long userId) {
        // Get the user
        User user = userService.getUserById(userId);

        // Get all course progress for the user
        List<UserCourseProgress> allCourseProgress = progressService.getAllCourseProgress(userId);

        // Get count of completed modules
        int totalModulesCompleted = progressService.getCompletedModulesCount(userId);

        // Calculate stats
        int totalCourses = allCourseProgress.size();
        int coursesCompleted = (int) allCourseProgress.stream()
                .filter(p -> p.getState() == UserCourseProgress.ProgressState.COMPLETED)
                .count();
        int coursesInProgress = (int) allCourseProgress.stream()
                .filter(p -> p.getState() == UserCourseProgress.ProgressState.IN_PROGRESS)
                .count();

        // Get 5 most recently accessed courses
        List<UserCourseProgress> recentCourses = allCourseProgress.stream()
                .sorted((p1, p2) -> p2.getLastAccessedAt().compareTo(p1.getLastAccessedAt()))
                .limit(5)
                .collect(Collectors.toList());

        // For each recent course, add its active module (if applicable)
        for (UserCourseProgress courseProgress : recentCourses) {
            if (courseProgress.getLastAccessedModule() != null) {
                Long moduleId = courseProgress.getLastAccessedModule().getId();
                UserModuleProgress moduleProgress = progressService.getModuleProgress(userId, moduleId);

                // Check if module should be auto-completed
                if (moduleProgress.getProgressPercentage() >= 95
                        && moduleProgress.getState() != UserModuleProgress.ModuleState.COMPLETED) {
                    progressService.checkAndCompleteModule(userId, moduleId);

                    // Refresh the module progress after check
                    moduleProgress = progressService.getModuleProgress(userId, moduleId);
                }
            }
        }

        // Build the DTO
        ProgressSummaryDto summary = new ProgressSummaryDto();
        summary.setTotalXP(user.getXp());
        summary.setTotalCourses(totalCourses);
        summary.setCoursesCompleted(coursesCompleted);
        summary.setCoursesInProgress(coursesInProgress);
        summary.setTotalModulesCompleted(totalModulesCompleted);
        summary.setRecentCourses(recentCourses);

        return ResponseEntity.ok(summary);
    }
}