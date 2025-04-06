package com.screening.interviews.service;

import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.*;
import com.screening.interviews.dto.CourseProgressDto;
import com.screening.interviews.dto.ModuleProgressDto;
import com.screening.interviews.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final UserCourseProgressRepository userCourseProgressRepository;
    private final UserModuleProgressRepository userModuleProgressRepository;
    private final UserService userService;

    /**
     * Enroll user in a course and initialize progress
     */
    @Transactional
    public UserCourseProgress enrollInCourse(Long userId, Long courseId) {
        // Check if already enrolled
        Optional<UserCourseProgress> existingProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId);

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        // Get user and course
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        // Create course progress
        UserCourseProgress courseProgress = new UserCourseProgress();
        courseProgress.setUser(user);
        courseProgress.setCourse(course);
        courseProgress.setStartedAt(LocalDateTime.now());
        courseProgress.setLastAccessedAt(LocalDateTime.now());
        courseProgress.setState(UserCourseProgress.ProgressState.IN_PROGRESS);

        userCourseProgressRepository.save(courseProgress);

        // Initialize the first module as UNLOCKED, others as LOCKED
        List<Module> modules = course.getModules();
        if (modules != null && !modules.isEmpty()) {
            for (int i = 0; i < modules.size(); i++) {
                Module module = modules.get(i);

                UserModuleProgress moduleProgress = new UserModuleProgress();
                moduleProgress.setUser(user);
                moduleProgress.setModule(module);

                // Count submodules for progress tracking
                int submoduleCount = module.getSubModules() != null ? module.getSubModules().size() : 0;
                moduleProgress.setTotalSubmodules(submoduleCount);

                // First module is unlocked, others locked
                if (i == 0) {
                    moduleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);
                } else {
                    moduleProgress.setState(UserModuleProgress.ModuleState.LOCKED);
                }

                userModuleProgressRepository.save(moduleProgress);
            }
        }

        return courseProgress;
    }

    /**
     * Get all course progress for a user
     */
    public List<UserCourseProgress> getAllCourseProgress(Long userId) {
        return userCourseProgressRepository.findByUserId(userId);
    }

    /**
     * Get specific course progress
     */
    public UserCourseProgress getCourseProgress(Long userId, Long courseId) {
        return userCourseProgressRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Progress not found for user id: " + userId + " and course id: " + courseId));
    }

    /**
     * Get module progress for a specific module
     */
    public UserModuleProgress getModuleProgress(Long userId, Long moduleId) {
        return userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module progress not found for user id: " + userId + " and module id: " + moduleId));
    }

    /**
     * Start a module (mark as IN_PROGRESS)
     */
    @Transactional
    public UserModuleProgress startModule(Long userId, Long moduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Only allow starting if UNLOCKED
        if (progress.getState() == UserModuleProgress.ModuleState.UNLOCKED) {
            progress.setState(UserModuleProgress.ModuleState.IN_PROGRESS);
            progress.setStartedAt(LocalDateTime.now());
            userModuleProgressRepository.save(progress);

            // Update course last accessed
            Module module = progress.getModule();
            updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);
        }

        return progress;
    }

    /**
     * Complete a submodule
     */
    @Transactional
    public UserModuleProgress completeSubmodule(Long userId, Long moduleId, Long submoduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Increment completed submodules
        progress.setCompletedSubmodules(progress.getCompletedSubmodules() + 1);

        // Calculate percentage
        int totalSubmodules = progress.getTotalSubmodules();
        if (totalSubmodules > 0) {
            int percentage = (progress.getCompletedSubmodules() * 100) / totalSubmodules;
            progress.setProgressPercentage(percentage);
        }

        // Update module state if needed
        if (progress.getState() != UserModuleProgress.ModuleState.COMPLETED) {
            progress.setState(UserModuleProgress.ModuleState.IN_PROGRESS);
        }

        // Add XP for submodule completion (10 XP per submodule)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setXp(user.getXp() + 10);
        progress.setEarnedXP(progress.getEarnedXP() + 10);
        userRepository.save(user);

        // Update course last accessed
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        // Check if all submodules completed
        checkAndUpdateModuleCompletion(progress);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Complete a quiz and record the score
     */
    @Transactional
    public UserModuleProgress completeQuiz(Long userId, Long moduleId, int score) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Update quiz status
        progress.setQuizCompleted(true);

        // Update best score if this is higher
        if (progress.getBestQuizScore() == null || score > progress.getBestQuizScore()) {
            progress.setBestQuizScore(score);
        }

        // Add XP based on score (1 XP per percentage point)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        int xpEarned = score;
        user.setXp(user.getXp() + xpEarned);
        progress.setEarnedXP(progress.getEarnedXP() + xpEarned);
        userRepository.save(user);

        // Update progress percentage if needed (quiz completion should be ~40% of module progress)
        int quizWeightedProgress = 40; // Quiz is 40% of total progress
        int submoduleWeightedProgress = progress.getTotalSubmodules() > 0 ?
                (progress.getCompletedSubmodules() * 60) / progress.getTotalSubmodules() : 60;

        int totalProgress = quizWeightedProgress + submoduleWeightedProgress;
        progress.setProgressPercentage(totalProgress);

        // Check if module should be completed
        checkAndUpdateModuleCompletion(progress);

        // Update course last accessed
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Check and update module completion status
     */
    private void checkAndUpdateModuleCompletion(UserModuleProgress progress) {
        // Module is complete if quiz is done and all submodules are done
        boolean allSubmodulesCompleted = progress.getTotalSubmodules() > 0 &&
                progress.getCompletedSubmodules() >= progress.getTotalSubmodules();

        if (progress.isQuizCompleted() && allSubmodulesCompleted) {
            // Mark module as completed
            progress.setState(UserModuleProgress.ModuleState.COMPLETED);
            progress.setCompletedAt(LocalDateTime.now());
            progress.setProgressPercentage(100);

            // Unlock next module if exists
            unlockNextModule(progress.getUser().getId(), progress.getModule());

            // Update course progress
            updateCourseProgress(progress.getUser().getId(), progress.getModule().getCourse().getId());
        }
    }

    /**
     * Unlock the next module
     */
    private void unlockNextModule(Long userId, Module completedModule) {
        Course course = completedModule.getCourse();
        List<Module> modules = course.getModules();

        // Find the index of the completed module
        int completedIndex = -1;
        for (int i = 0; i < modules.size(); i++) {
            if (modules.get(i).getId().equals(completedModule.getId())) {
                completedIndex = i;
                break;
            }
        }

        // If there's a next module, unlock it
        if (completedIndex >= 0 && completedIndex < modules.size() - 1) {
            Module nextModule = modules.get(completedIndex + 1);

            UserModuleProgress nextModuleProgress = userModuleProgressRepository
                    .findByUserIdAndModuleId(userId, nextModule.getId())
                    .orElseGet(() -> {
                        // Create new progress if it doesn't exist
                        UserModuleProgress newProgress = new UserModuleProgress();
                        newProgress.setUser(userRepository.findById(userId).orElseThrow());
                        newProgress.setModule(nextModule);
                        newProgress.setTotalSubmodules(nextModule.getSubModules() != null ?
                                nextModule.getSubModules().size() : 0);
                        return newProgress;
                    });

            nextModuleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);
            userModuleProgressRepository.save(nextModuleProgress);
        }
    }

    // In ProgressService.java, update the following method to use the corrected repository method name:

    /**
     * Update course progress when a module is completed
     */
    @Transactional
    protected void updateCourseProgress(Long userId, Long courseId) {
        UserCourseProgress courseProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course progress not found"));

        Course course = courseProgress.getCourse();
        List<Module> allModules = course.getModules();

        if (allModules == null || allModules.isEmpty()) {
            return;
        }

        // Count completed modules - Update this line to use the corrected method name
        List<UserModuleProgress> moduleProgressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(userId, courseId);

        int completedModules = 0;
        int totalModules = allModules.size();
        int totalEarnedXP = 0;

        for (UserModuleProgress moduleProgress : moduleProgressList) {
            if (moduleProgress.getState() == UserModuleProgress.ModuleState.COMPLETED) {
                completedModules++;
            }
            totalEarnedXP += moduleProgress.getEarnedXP();
        }

        // Calculate overall progress percentage
        int progressPercentage = (completedModules * 100) / totalModules;
        courseProgress.setProgressPercentage(progressPercentage);
        courseProgress.setEarnedXP(totalEarnedXP);

        // Check if course is completed
        if (progressPercentage == 100) {
            courseProgress.setState(UserCourseProgress.ProgressState.COMPLETED);
            courseProgress.setCompletedAt(LocalDateTime.now());

            // Add course completion XP bonus (100 XP)
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + 100);
            courseProgress.setEarnedXP(courseProgress.getEarnedXP() + 100);

            // Add to user's completed courses set
            user.getCompletedCourses().add(courseId);
            userRepository.save(user);
        }

        userCourseProgressRepository.save(courseProgress);
    }


    /**
     * Update last accessed module for a course
     */
    private void updateCourseLastAccessed(Long userId, Long courseId, Long moduleId) {
        UserCourseProgress courseProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course progress not found"));

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        courseProgress.setLastAccessedModule(module);
        courseProgress.setLastAccessedAt(LocalDateTime.now());

        userCourseProgressRepository.save(courseProgress);
    }

    /**
     * Check if user has access to a module
     */
    public boolean canAccessModule(Long userId, Long moduleId) {
        Optional<UserModuleProgress> progressOpt = userModuleProgressRepository
                .findByUserIdAndModuleId(userId, moduleId);

        if (progressOpt.isEmpty()) {
            return false;
        }

        UserModuleProgress progress = progressOpt.get();
        return progress.getState() == UserModuleProgress.ModuleState.UNLOCKED ||
                progress.getState() == UserModuleProgress.ModuleState.IN_PROGRESS ||
                progress.getState() == UserModuleProgress.ModuleState.COMPLETED;
    }

    /**
     * Get count of completed modules for a user
     */
    public int getCompletedModulesCount(Long userId) {
        return userModuleProgressRepository.countCompletedModulesByUserId(userId);
    }
}