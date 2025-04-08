package com.screening.interviews.controller;

import com.screening.interviews.model.User;
import com.screening.interviews.service.DetailedProgressService;
import com.screening.interviews.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for user achievements, gamification, and progress stats
 */
@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final DetailedProgressService detailedProgressService;
    private final UserService userService;

    /**
     * Get current user's achievements and progress stats
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserAchievements() {
        User currentUser = userService.getCurrentUser();
        Map<String, Object> achievements = detailedProgressService.getUserAchievements(currentUser.getId());
        return ResponseEntity.ok(achievements);
    }

    /**
     * Get detailed progress for all modules in a course
     */
    @GetMapping("/course/{courseId}/detailed-progress")
    public ResponseEntity<Map<String, Object>> getCourseDetailedProgress(@PathVariable Long courseId) {
        User currentUser = userService.getCurrentUser();
        Map<String, Object> detailedProgress = detailedProgressService
                .getCourseModulesDetailedProgress(currentUser.getId(), courseId);
        return ResponseEntity.ok(detailedProgress);
    }

    /**
     * Get achievements for a specific user (admin only)
     */
    @GetMapping("/admin/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserAchievementsAdmin(@PathVariable Long userId) {
        // In production, add security check to ensure only admins can access
        Map<String, Object> achievements = detailedProgressService.getUserAchievements(userId);
        return ResponseEntity.ok(achievements);
    }
}