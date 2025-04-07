package com.screening.interviews.service;

import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.*;
import com.screening.interviews.dto.CourseProgressDto;
import com.screening.interviews.dto.ModuleProgressDto;
import com.screening.interviews.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final UserCourseProgressRepository userCourseProgressRepository;
    private final UserModuleProgressRepository userModuleProgressRepository;
    private final UserService userService;
    private final QuizRepository quizRepository;
    private final SubModuleRepository subModuleRepository;

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

                // Count all learning content items for more precise progress tracking
                int totalSubmodules = countLearningItems(module);
                moduleProgress.setTotalSubmodules(totalSubmodules);

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
     * Count total learning items (submodules, videos, quizzes) in a module
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
        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

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
     * Complete a submodule and update all related progress
     */
    @Transactional
    public UserModuleProgress completeSubmodule(Long userId, Long moduleId, Long submoduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Increment completed submodules if not already completed
        // Check if this submodule was already completed to avoid double-counting
        boolean isNewCompletion = incrementCompletedSubmodule(progress);

        // Calculate percentage
        updateModuleProgressPercentage(progress);

        // Only award XP if this is a new completion
        if (isNewCompletion) {
            // Add XP for submodule completion (10 XP per submodule)
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            user.setXp(user.getXp() + 10);
            progress.setEarnedXP(progress.getEarnedXP() + 10);
            userRepository.save(user);
        }

        // Update course last accessed
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        // Check if all required elements completed
        checkAndUpdateModuleCompletion(progress);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Increment the completed submodule counter
     * @return true if newly completed, false if already completed
     */
    private boolean incrementCompletedSubmodule(UserModuleProgress progress) {
        int currentCompleted = progress.getCompletedSubmodules();
        int totalSubmodules = progress.getTotalSubmodules();

        // Ensure we don't exceed the total
        if (currentCompleted < totalSubmodules) {
            progress.setCompletedSubmodules(currentCompleted + 1);
            return true;
        }

        return false;
    }

    /**
     * Update the progress percentage of a module
     */
    private void updateModuleProgressPercentage(UserModuleProgress progress) {
        int totalSubmodules = progress.getTotalSubmodules();
        if (totalSubmodules > 0) {
            int percentage = Math.min(100, (progress.getCompletedSubmodules() * 100) / totalSubmodules);
            progress.setProgressPercentage(percentage);
        }
    }

    /**
     * Complete a quiz and record the score
     */
    @Transactional
    public UserModuleProgress completeQuiz(Long userId, Long moduleId, int score) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Check if quiz was already completed to determine if this is a new completion or retake
        boolean isFirstCompletion = !progress.isQuizCompleted();

        // Update quiz status
        progress.setQuizCompleted(true);

        // Update best score if this is higher
        boolean improvedScore = false;
        if (progress.getBestQuizScore() == null || score > progress.getBestQuizScore()) {
            progress.setBestQuizScore(score);
            improvedScore = true;
        }

        // Add XP based on score and whether it's a new completion or improved score
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (isFirstCompletion || improvedScore) {
            // Calculate XP to award - 1 XP per percentage point on first completion
            // For improved scores, award the difference
            int xpToAward;
            if (isFirstCompletion) {
                xpToAward = score;
            } else {
                // Only award XP for improvement
                xpToAward = score - progress.getBestQuizScore();
            }

            if (xpToAward > 0) {
                user.setXp(user.getXp() + xpToAward);
                progress.setEarnedXP(progress.getEarnedXP() + xpToAward);
                userRepository.save(user);
            }
        }

        // If this is a first-time quiz completion, count it toward module progress
        if (isFirstCompletion) {
            // Mark quiz as a completed learning item
            incrementCompletedSubmodule(progress);
        }

        // Update progress percentage
        updateModuleProgressPercentage(progress);

        // Check if module should be completed
        checkAndUpdateModuleCompletion(progress);

        // Update course last accessed
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Complete a video and update progress
     */
    @Transactional
    public UserModuleProgress completeVideo(Long userId, Long moduleId, String videoId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Mark the video as completed - similar to submodule completion
        boolean isNewCompletion = incrementCompletedSubmodule(progress);

        // Calculate percentage
        updateModuleProgressPercentage(progress);

        // Only award XP if this is a new completion
        if (isNewCompletion) {
            // Add XP for video completion (15 XP per video)
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            user.setXp(user.getXp() + 15);
            progress.setEarnedXP(progress.getEarnedXP() + 15);
            userRepository.save(user);
        }

        // Update course last accessed
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        // Check if all required elements completed
        checkAndUpdateModuleCompletion(progress);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Check and update module completion status
     */
    private void checkAndUpdateModuleCompletion(UserModuleProgress progress) {
        // Module is complete if all learning items (submodules, videos, quiz) are done
        boolean allItemsCompleted = progress.getTotalSubmodules() > 0 &&
                progress.getCompletedSubmodules() >= progress.getTotalSubmodules();

        if (allItemsCompleted) {
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
                        newProgress.setUser(userRepository.findById(userId).orElseThrow(
                                () -> new ResourceNotFoundException("User not found")));
                        newProgress.setModule(nextModule);
                        newProgress.setTotalSubmodules(countLearningItems(nextModule));
                        return newProgress;
                    });

            nextModuleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);
            userModuleProgressRepository.save(nextModuleProgress);
        }
    }

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

        // Get all module progress for this course
        List<UserModuleProgress> moduleProgressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(userId, courseId);

        int completedModules = 0;
        int totalModules = allModules.size();
        int totalEarnedXP = 0;

        // Calculate total progress percentage across all modules
        double totalProgressPercentage = 0;

        for (UserModuleProgress moduleProgress : moduleProgressList) {
            if (moduleProgress.getState() == UserModuleProgress.ModuleState.COMPLETED) {
                completedModules++;
            }
            totalEarnedXP += moduleProgress.getEarnedXP();
            totalProgressPercentage += moduleProgress.getProgressPercentage();
        }

        // Calculate overall course progress percentage
        // 1. Based on completed modules
        int completionPercentage = (completedModules * 100) / totalModules;

        // 2. Based on average progress across all modules
        int averageProgressPercentage =
                moduleProgressList.isEmpty() ? 0 : (int) (totalProgressPercentage / moduleProgressList.size());

        // Use the combined approach for more accurate tracking
        int progressPercentage = (completionPercentage + averageProgressPercentage) / 2;

        courseProgress.setProgressPercentage(progressPercentage);
        courseProgress.setEarnedXP(totalEarnedXP);

        // Check if course is completed
        if (completedModules == totalModules) {
            courseProgress.setState(UserCourseProgress.ProgressState.COMPLETED);
            courseProgress.setCompletedAt(LocalDateTime.now());
            courseProgress.setProgressPercentage(100); // Ensure it shows as 100% when all modules are done

            // Add course completion XP bonus (100 XP) - only if not already completed
            if (courseProgress.getState() != UserCourseProgress.ProgressState.COMPLETED) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                user.setXp(user.getXp() + 100);
                courseProgress.setEarnedXP(courseProgress.getEarnedXP() + 100);

                // Add to user's completed courses set
                user.getCompletedCourses().add(courseId);
                userRepository.save(user);
            }
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

    /**
     * Get all module progress for a specific course with a map for easy access
     */
    public Map<String, Object> getCourseWithAllProgress(Long userId, Long courseId) {
        Map<String, Object> result = new HashMap<>();

        // Get course progress
        UserCourseProgress courseProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElse(null);

        if (courseProgress == null) {
            return result;
        }

        // Get all module progress for this course
        List<UserModuleProgress> moduleProgressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(userId, courseId);

        // Create a map of module IDs to progress objects for easy access
        Map<Long, UserModuleProgress> moduleProgressMap = new HashMap<>();
        for (UserModuleProgress progress : moduleProgressList) {
            moduleProgressMap.put(progress.getModule().getId(), progress);
        }

        result.put("courseProgress", courseProgress);
        result.put("moduleProgressMap", moduleProgressMap);

        return result;
    }

    /**
     * Recalculate module progress based on completed items
     * This can be used when the content of a module changes
     */
    @Transactional
    public UserModuleProgress recalculateModuleProgress(Long userId, Long moduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Module module = progress.getModule();

        // Update total submodules
        int totalItems = countLearningItems(module);
        progress.setTotalSubmodules(totalItems);

        // Recalculate progress percentage
        updateModuleProgressPercentage(progress);

        // Check if module should be marked as completed
        checkAndUpdateModuleCompletion(progress);

        return userModuleProgressRepository.save(progress);
    }

    /**
     * Reset progress for a specific module (for testing or when content changes significantly)
     */
    @Transactional
    public UserModuleProgress resetModuleProgress(Long userId, Long moduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        // Revert progress to initial state
        progress.setCompletedSubmodules(0);
        progress.setProgressPercentage(0);
        progress.setQuizCompleted(false);
        progress.setBestQuizScore(null);

        // Only revert XP if module was completed
        if (progress.getState() == UserModuleProgress.ModuleState.COMPLETED) {
            int xpToRevert = progress.getEarnedXP();
            progress.setEarnedXP(0);

            // Revert user XP
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(Math.max(0, user.getXp() - xpToRevert));
            userRepository.save(user);

            // Update course progress
            UserCourseProgress courseProgress = userCourseProgressRepository
                    .findByUserIdAndCourseId(userId, progress.getModule().getCourse().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course progress not found"));
            courseProgress.setEarnedXP(courseProgress.getEarnedXP() - xpToRevert);
            userCourseProgressRepository.save(courseProgress);
        }

        // Set state to IN_PROGRESS unless it was LOCKED
        if (progress.getState() != UserModuleProgress.ModuleState.LOCKED) {
            progress.setState(UserModuleProgress.ModuleState.IN_PROGRESS);
            progress.setCompletedAt(null);
        }

        return userModuleProgressRepository.save(progress);
    }


    @Transactional
    public int updateTotalSubmodules(Long moduleId) {
        log.info("Updating total submodules count for module ID: {}", moduleId);

        // Get the module to check if it exists and to get video count
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found with ID: " + moduleId));

        // Count all components
        int subModulesCount = subModuleRepository.countByModuleId(moduleId);
        int quizzesCount = quizRepository.countByModuleId(moduleId);
        int videosCount = module.getVideoUrls() != null ? module.getVideoUrls().size() : 0;

        int totalComponents = subModulesCount + quizzesCount + videosCount;
        log.info("Module ID {} has {} submodules, {} quizzes, and {} videos, total: {}",
                moduleId, subModulesCount, quizzesCount, videosCount, totalComponents);

        // Get all progress entries for this module
        List<UserModuleProgress> progressEntries = userModuleProgressRepository.findByModuleId(moduleId);

        if (progressEntries.isEmpty()) {
            log.info("No progress entries found for module ID: {}", moduleId);
            return 0;
        }

        // Update each progress entry
        for (UserModuleProgress progress : progressEntries) {
            progress.setTotalSubmodules(totalComponents);

            // Recalculate progress percentage
            if (totalComponents > 0 && progress.getCompletedSubmodules() > 0) {
                int newPercentage = Math.min(100,
                        (int) Math.round(((double) progress.getCompletedSubmodules() / totalComponents) * 100));
                progress.setProgressPercentage(newPercentage);

                // Update state if needed
                if (newPercentage >= 100 && progress.getState() != UserModuleProgress.ModuleState.COMPLETED) {
                    progress.setState(UserModuleProgress.ModuleState.COMPLETED);
                } else if (progress.getState() == UserModuleProgress.ModuleState.UNLOCKED && newPercentage > 0) {
                    progress.setState(UserModuleProgress.ModuleState.IN_PROGRESS);
                }
            }
        }

        userModuleProgressRepository.saveAll(progressEntries);
        log.info("Updated {} progress entries for module ID: {}", progressEntries.size(), moduleId);

        return progressEntries.size();
    }
}