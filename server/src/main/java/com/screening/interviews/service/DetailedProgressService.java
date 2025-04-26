package com.screening.interviews.service;

import com.screening.interviews.dto.ContentProgressDto;
import com.screening.interviews.dto.DetailedModuleProgressDto;
import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.*;
import com.screening.interviews.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DetailedProgressService {

    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final UserModuleProgressRepository userModuleProgressRepository;
    private final UserSubmoduleProgressRepository userSubmoduleProgressRepository;
    private final ProgressService progressService;

    public DetailedModuleProgressDto getDetailedModuleProgress(Long userId, Long moduleId) {
        UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module progress not found for user id: " + userId + " and module id: " + moduleId));

        List<UserSubmoduleProgress> submoduleItems = userSubmoduleProgressRepository
                .findByUserIdAndModuleIdAndContentType(userId, moduleId, UserSubmoduleProgress.ContentType.SUBMODULE);

        List<ContentProgressDto> submoduleDtos = submoduleItems.stream()
                .map(ContentProgressDto::fromEntity)
                .collect(Collectors.toList());

        List<UserSubmoduleProgress> videoItems = userSubmoduleProgressRepository
                .findByUserIdAndModuleIdAndContentType(userId, moduleId, UserSubmoduleProgress.ContentType.VIDEO);

        List<ContentProgressDto> videoDtos = videoItems.stream()
                .map(ContentProgressDto::fromEntity)
                .collect(Collectors.toList());

        List<UserSubmoduleProgress> quizItems = userSubmoduleProgressRepository
                .findByUserIdAndModuleIdAndContentType(userId, moduleId, UserSubmoduleProgress.ContentType.QUIZ);

        List<ContentProgressDto> quizDtos = quizItems.stream()
                .map(ContentProgressDto::fromEntity)
                .collect(Collectors.toList());

        return DetailedModuleProgressDto.fromEntities(
                moduleProgress, submoduleDtos, videoDtos, quizDtos);
    }

    @Transactional
    public void unlockAndInitializeModule(Long userId, Long moduleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        UserModuleProgress moduleProgress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseGet(() -> {
                    UserModuleProgress newProgress = new UserModuleProgress();
                    newProgress.setUser(user);
                    newProgress.setModule(module);
                    newProgress.setTotalSubmodules(countLearningItems(module));
                    return newProgress;
                });

        if (moduleProgress.getState() == UserModuleProgress.ModuleState.LOCKED) {
            moduleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);
            userModuleProgressRepository.save(moduleProgress);
        }

        initializeContentItems(user, module);
    }

    private void initializeContentItems(User user, Module module) {
        if (module.getSubModules() != null) {
            for (SubModule subModule : module.getSubModules()) {
                createSubmoduleProgressIfNotExists(
                        user.getId(),
                        module.getId(),
                        UserSubmoduleProgress.ContentType.SUBMODULE,
                        subModule.getId().toString()
                );
            }
        }

        if (module.getQuizzes() != null) {
            for (Quiz quiz : module.getQuizzes()) {
                createSubmoduleProgressIfNotExists(
                        user.getId(),
                        module.getId(),
                        UserSubmoduleProgress.ContentType.QUIZ,
                        quiz.getId().toString()
                );
            }
        }

        if (module.getVideoUrls() != null) {
            for (String videoUrl : module.getVideoUrls()) {
                createSubmoduleProgressIfNotExists(
                        user.getId(),
                        module.getId(),
                        UserSubmoduleProgress.ContentType.VIDEO,
                        videoUrl
                );
            }
        }
    }

    private UserSubmoduleProgress createSubmoduleProgressIfNotExists(
            Long userId, Long moduleId, UserSubmoduleProgress.ContentType contentType, String contentId) {

        // Check if entry already exists
        Optional<UserSubmoduleProgress> existingProgress = userSubmoduleProgressRepository
                .findByUserIdAndModuleIdAndContentTypeAndContentId(userId, moduleId, contentType, contentId);

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        // Create new progress entry
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        UserSubmoduleProgress progress = new UserSubmoduleProgress();
        progress.setUser(user);
        progress.setModule(module);
        progress.setContentType(contentType);
        progress.setContentId(contentId);
        progress.setCompleted(false);

        return userSubmoduleProgressRepository.save(progress);
    }

    /**
     * Count total learning items in a module
     */
    private int countLearningItems(Module module) {
        int count = 0;

        // Count submodules
        if (module.getSubModules() != null) {
            count += module.getSubModules().size();
        }

        // Count videos
        if (module.getVideoUrls() != null) {
            count += module.getVideoUrls().size();
        }

        // Count quizzes
        if (module.getQuizzes() != null) {
            count += module.getQuizzes().size();
        }

        // Ensure at least 1 item for progress calculation
        return Math.max(count, 1);
    }

    /**
     * Get all course modules with their detailed progress
     */
    public Map<String, Object> getCourseModulesDetailedProgress(Long userId, Long courseId) {
        Map<String, Object> result = new HashMap<>();

        // Get all module progress for this course
        List<UserModuleProgress> moduleProgressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(userId, courseId);

        // Create a map of module IDs to detailed progress
        Map<Long, DetailedModuleProgressDto> detailedProgressMap = new HashMap<>();

        for (UserModuleProgress progress : moduleProgressList) {
            Long moduleId = progress.getModule().getId();
            DetailedModuleProgressDto detailedProgress = getDetailedModuleProgress(userId, moduleId);
            detailedProgressMap.put(moduleId, detailedProgress);
        }

        result.put("courseId", courseId);
        result.put("userId", userId);
        result.put("moduleProgressMap", detailedProgressMap);

        return result;
    }

    /**
     * Get user achievements for all completed content
     */
    public Map<String, Object> getUserAchievements(Long userId) {
        Map<String, Object> achievements = new HashMap<>();

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Count completed content by type
        int completedSubmodules = userSubmoduleProgressRepository
                .findByUserIdAndContentTypeAndCompleted(userId, UserSubmoduleProgress.ContentType.SUBMODULE, true).size();

        int completedVideos = userSubmoduleProgressRepository
                .findByUserIdAndContentTypeAndCompleted(userId, UserSubmoduleProgress.ContentType.VIDEO, true).size();

        int completedQuizzes = userSubmoduleProgressRepository
                .findByUserIdAndContentTypeAndCompleted(userId, UserSubmoduleProgress.ContentType.QUIZ, true).size();

        // Get module achievements
        int completedModules = progressService.getCompletedModulesCount(userId);

        // Calculate total XP earned
        achievements.put("userId", userId);
        achievements.put("username", user.getUsername());
        achievements.put("totalXP", user.getXp());
        achievements.put("level", user.getLevel());
        achievements.put("levelProgress", user.getLevelProgress());
        achievements.put("completedSubmodules", completedSubmodules);
        achievements.put("completedVideos", completedVideos);
        achievements.put("completedQuizzes", completedQuizzes);
        achievements.put("completedModules", completedModules);
        achievements.put("completedCourses", user.getCompletedCourses().size());

        return achievements;
    }
}