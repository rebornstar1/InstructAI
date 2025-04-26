package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.*;
import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.model.Thread;
import com.screening.interviews.repo.*;
import com.screening.interviews.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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
    private final ModuleService moduleService;
    private final ThreadRepository threadRepository;
    private final ObjectMapper objectMapper;
    private final UserModuleStepProgressRepository userModuleStepProgressRepository;

    @Transactional
    public UserCourseProgress enrollInCourse(Long userId, Long courseId) {
        Optional<UserCourseProgress> existingProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId);

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        UserCourseProgress courseProgress = new UserCourseProgress();
        courseProgress.setUser(user);
        courseProgress.setCourse(course);
        courseProgress.setStartedAt(LocalDateTime.now());
        courseProgress.setLastAccessedAt(LocalDateTime.now());
        courseProgress.setState(UserCourseProgress.ProgressState.IN_PROGRESS);

        userCourseProgressRepository.save(courseProgress);

        List<Module> modules = course.getModules();
        if (modules != null && !modules.isEmpty()) {
            for (int i = 0; i < modules.size(); i++) {
                Module module = modules.get(i);

                UserModuleProgress moduleProgress = new UserModuleProgress();
                moduleProgress.setUser(user);
                moduleProgress.setModule(module);

                int totalSubmodules = countLearningItems(module);
                moduleProgress.setTotalSubmodules(totalSubmodules);

                if (i == 0) {
                    moduleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);

                    if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty()) {
                        moduleProgress.setActiveTerm(0);
                        moduleProgress.unlockTerm(0);
                    }
                } else {
                    moduleProgress.setState(UserModuleProgress.ModuleState.LOCKED);
                }

                userModuleProgressRepository.save(moduleProgress);
            }
        }

        addUserToThreadsByCourse(user, course);

        return courseProgress;
    }

    public List<UserCourseProgress> getAllCourseProgress(Long userId) {
        return userCourseProgressRepository.findByUserId(userId);
    }

    public UserCourseProgress getCourseProgress(Long userId, Long courseId) {
        return userCourseProgressRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Progress not found for user id: " + userId + " and course id: " + courseId));
    }

    public UserModuleProgress getModuleProgress(Long userId, Long moduleId) {
        return userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module progress not found for user id: " + userId + " and module id: " + moduleId));
    }

    @Transactional
    public UserModuleProgress startModule(Long userId, Long moduleId) {
        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        log.info("progress ye rahi bhai {}",progress);

        if (progress.getState() == UserModuleProgress.ModuleState.UNLOCKED) {
            progress.setState(UserModuleProgress.ModuleState.IN_PROGRESS);
            progress.setStartedAt(LocalDateTime.now());

            Module module = progress.getModule();

            log.info("module toh ye raha {}",module);

            if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty() &&
                    (progress.getUnlockedTerms() == null || progress.getUnlockedTerms().isEmpty())) {
                progress.setActiveTerm(0);
                progress.unlockTerm(0);
            }

            userModuleProgressRepository.save(progress);

            updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);
        }

        return progress;
    }

    @Transactional
    public UserModuleProgress completeSubmodule(Long userId, Long moduleId, Long submoduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        boolean isNewCompletion = incrementCompletedSubmodule(progress);

        updateModuleProgressPercentage(progress);

        if (isNewCompletion) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            user.setXp(user.getXp() + 10);
            progress.setEarnedXP(progress.getEarnedXP() + 10);
            userRepository.save(user);
        }

        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        checkAndUpdateModuleCompletion(progress);

        return userModuleProgressRepository.save(progress);
    }

    @Transactional
    public UserModuleProgress completeKeyTerm(Long userId, Long moduleId, Integer termIndex) {
        log.info("Completing key term {} for module {} and user {}", termIndex, moduleId, userId);

        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Module module = progress.getModule();
        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            throw new IllegalArgumentException("Invalid term index: " + termIndex);
        }
        if (progress.isTermCompleted(termIndex)) {
            log.info("Term {} is already completed for module {} and user {}", termIndex, moduleId, userId);
            return progress;
        }
        progress.completeTerm(termIndex);

        incrementCompletedSubmodule(progress);
        updateModuleProgressPercentage(progress);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setXp(user.getXp() + 25);
        progress.setEarnedXP(progress.getEarnedXP() + 25);
        userRepository.save(user);

        int nextTermIndex = termIndex + 1;
        if (nextTermIndex < module.getKeyTerms().size()) {
            progress.unlockTerm(nextTermIndex);
            progress.setActiveTerm(nextTermIndex);
            log.info("Unlocked next term {} for module {} and user {}", nextTermIndex, moduleId, userId);
        } else {
            log.info("No more terms to unlock for module {} and user {}", moduleId, userId);
        }

        if (progress.getCompletedTerms().size() == module.getKeyTerms().size()) {
            log.info("All terms completed for module {} and user {}", moduleId, userId);
            progress.setState(UserModuleProgress.ModuleState.COMPLETED);
            progress.setCompletedAt(LocalDateTime.now());
            progress.setProgressPercentage(100);

            updateCourseProgress(userId, module.getCourse().getId());
        }

        return userModuleProgressRepository.save(progress);
    }

    @Transactional
    public UserModuleProgress saveTermResources(Long userId, Long moduleId, Integer termIndex,
                                                Map<String, Object> resources) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        try {
            Map<String, Object> allTermResources;
            if (progress.getTermResourcesData() != null && !progress.getTermResourcesData().isEmpty()) {
                allTermResources = objectMapper.readValue(progress.getTermResourcesData(), Map.class);
            } else {
                allTermResources = new HashMap<>();
            }

            allTermResources.put(String.valueOf(termIndex), resources);

            progress.setTermResourcesData(objectMapper.writeValueAsString(allTermResources));

            return userModuleProgressRepository.save(progress);
        } catch (JsonProcessingException e) {
            log.error("Error serializing term resources: {}", e.getMessage());
            throw new RuntimeException("Failed to save term resources", e);
        }
    }

    public List<KeyTermProgressDto> getKeyTermProgress(Long userId, Long moduleId) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Module module = progress.getModule();

        if (module.getKeyTerms() == null || module.getKeyTerms().isEmpty()) {
            return new ArrayList<>();
        }

        Map<String, Object> termResources = null;
        if (progress.getTermResourcesData() != null && !progress.getTermResourcesData().isEmpty()) {
            try {
                termResources = objectMapper.readValue(progress.getTermResourcesData(), Map.class);
            } catch (JsonProcessingException e) {
                log.error("Error parsing term resources: {}", e.getMessage());
            }
        }

        return KeyTermProgressDto.createFromModuleProgress(
                module.getKeyTerms(),
                module.getDefinitions(),
                progress.getActiveTerm(),
                progress.getUnlockedTerms(),
                progress.getCompletedTerms(),
                termResources
        );
    }

    @Transactional
    public UserModuleProgress setActiveTerm(Long userId, Long moduleId, Integer termIndex) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Module module = progress.getModule();

        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            throw new IllegalArgumentException("Invalid term index: " + termIndex);
        }

        if (!progress.isTermUnlocked(termIndex)) {
            throw new IllegalArgumentException("Term is not unlocked: " + termIndex);
        }

        progress.setActiveTerm(termIndex);
        return userModuleProgressRepository.save(progress);
    }

    @Transactional
    public UserModuleProgress completeQuiz(Long userId, Long moduleId, int score) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        boolean isFirstCompletion = !progress.isQuizCompleted();

        progress.setQuizCompleted(true);

        boolean improvedScore = false;
        if (progress.getBestQuizScore() == null || score > progress.getBestQuizScore()) {
            progress.setBestQuizScore(score);
            improvedScore = true;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (isFirstCompletion || improvedScore) {
            int xpToAward;
            if (isFirstCompletion) {
                xpToAward = score;
            } else {
                xpToAward = score - progress.getBestQuizScore();
            }

            if (xpToAward > 0) {
                user.setXp(user.getXp() + xpToAward);
                progress.setEarnedXP(progress.getEarnedXP() + xpToAward);
                userRepository.save(user);
            }
        }

        if (isFirstCompletion) {
            incrementCompletedSubmodule(progress);
        }

        updateModuleProgressPercentage(progress);
        checkAndUpdateModuleCompletion(progress);
        Module module = progress.getModule();
        updateCourseLastAccessed(userId, module.getCourse().getId(), moduleId);

        return userModuleProgressRepository.save(progress);
    }

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
     * Update term resources completion status
     * This method handles updates when individual components (article, quiz, video) of a term are completed
     */
    @Transactional
    public UserModuleProgress updateTermResourceCompletion(Long userId, Long moduleId,
                                                           Integer termIndex, String resourceType) {
        UserModuleProgress progress = getModuleProgress(userId, moduleId);

        try {
            // Get existing term resources
            Map<String, Object> allTermResources;
            if (progress.getTermResourcesData() != null && !progress.getTermResourcesData().isEmpty()) {
                allTermResources = objectMapper.readValue(progress.getTermResourcesData(), Map.class);
            } else {
                allTermResources = new HashMap<>();
            }

            // Get resources for this term
            String termKey = String.valueOf(termIndex);
            Map<String, Object> termResources = allTermResources.containsKey(termKey) ?
                    (Map<String, Object>) allTermResources.get(termKey) : new HashMap<>();

            // Update the completion status based on resource type
            switch (resourceType.toLowerCase()) {
                case "article":
                    termResources.put("articleCompleted", true);
                    break;
                case "video":
                    termResources.put("videoCompleted", true);
                    break;
                case "quiz":
                    termResources.put("quizCompleted", true);
                    break;
                default:
                    log.warn("Unknown resource type: {}", resourceType);
            }

            // Check if all required resources are completed
            boolean articleCompleted = Boolean.TRUE.equals(termResources.get("articleCompleted"));
            boolean videoCompleted = true; // Optional - defaults to true if videoUrl is not present
            boolean quizCompleted = Boolean.TRUE.equals(termResources.get("quizCompleted"));

            // Check if video is required (if videoUrl is present)
            if (termResources.containsKey("videoUrl") && termResources.get("videoUrl") != null) {
                videoCompleted = Boolean.TRUE.equals(termResources.get("videoCompleted"));
            }

            // Update term resources
            allTermResources.put(termKey, termResources);
            progress.setTermResourcesData(objectMapper.writeValueAsString(allTermResources));

            // If all required resources are completed, mark term as completed
            if (articleCompleted && videoCompleted && quizCompleted) {
                log.info("All resources completed for term {}, marking term as completed", termIndex);
                return completeKeyTerm(userId, moduleId, termIndex);
            }

            return userModuleProgressRepository.save(progress);
        } catch (JsonProcessingException e) {
            log.error("Error processing term resources: {}", e.getMessage());
            throw new RuntimeException("Failed to update term resource completion", e);
        }
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
     * Check and update module completion status
     */
    private void checkAndUpdateModuleCompletion(UserModuleProgress progress) {
        // Module is complete if all learning items (submodules, videos, quiz) are done
        boolean allItemsCompleted = progress.getTotalSubmodules() > 0 &&
                progress.getCompletedSubmodules() >= progress.getTotalSubmodules();

        // For modules with key terms, check if all terms are completed
        Module module = progress.getModule();
        boolean allTermsCompleted = true;

        if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty()) {
            allTermsCompleted = progress.getCompletedTerms() != null &&
                    progress.getCompletedTerms().size() >= module.getKeyTerms().size();
        }

        // Module is complete if all submodules and all terms (if applicable) are completed
        if (allItemsCompleted && allTermsCompleted) {
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

    private void addUserToThreadsByCourse(User user, Course course) {
        // Find all threads related to this course
        List<Thread> relatedThreads = threadRepository.findByCourseId(course.getId());

        // Add user to each thread
        for (Thread thread : relatedThreads) {
            thread.addMember(user);
            threadRepository.save(thread);
            log.info("Added user {} to thread {} after course enrollment", user.getId(), thread.getId());
        }
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

        // Reset key term progress
        if (progress.getUnlockedTerms() != null && !progress.getUnlockedTerms().isEmpty()) {
            List<Integer> unlockedTerms = new ArrayList<>();
            unlockedTerms.add(0); // Only keep first term unlocked
            progress.setUnlockedTerms(unlockedTerms);
            progress.setCompletedTerms(new ArrayList<>());
            progress.setActiveTerm(0);
            progress.setTermResourcesData(null); // Clear all term resources
        }

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
        int keyTermsCount = module.getKeyTerms() != null ? module.getKeyTerms().size() : 0;

        // For modules using key terms, count key terms as part of learning items
        int totalComponents = subModulesCount + quizzesCount + videosCount;
        if (keyTermsCount > 0) {
            totalComponents += keyTermsCount;
        }

        log.info("Module ID {} has {} submodules, {} quizzes, {} videos, and {} key terms, total: {}",
                moduleId, subModulesCount, quizzesCount, videosCount, keyTermsCount, totalComponents);

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

    /**
     * Check and update module completion status if progress is 100%
     * Also unlocks the next module if available
     */
    @Transactional
    public UserModuleProgress checkAndCompleteModule(Long userId, Long moduleId) {
        log.info("Checking if module {} is completed for user {}", moduleId, userId);

        UserModuleProgress progress = userModuleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module progress not found for user id: " + userId + " and module id: " + moduleId));

        // If already completed, no need to do anything
        if (progress.getState() == UserModuleProgress.ModuleState.COMPLETED) {
            log.info("Module {} is already completed for user {}", moduleId, userId);
            return progress;
        }

        // For modules with key terms, check if all terms are completed
        Module module = progress.getModule();
        boolean useKeyTerms = module.getKeyTerms() != null && !module.getKeyTerms().isEmpty();

        boolean isCompleted;
        if (useKeyTerms) {
            // Module is completed if all key terms are completed
            isCompleted = progress.getCompletedTerms() != null &&
                    progress.getCompletedTerms().size() >= module.getKeyTerms().size();
        } else {
            // For modules without key terms, use the regular progress percentage
            isCompleted = progress.getProgressPercentage() >= 100;
        }

        if (isCompleted) {
            log.info("Module {} is complete for user {}, marking as completed", moduleId, userId);

            // Mark as completed
            progress.setState(UserModuleProgress.ModuleState.COMPLETED);
            progress.setCompletedAt(LocalDateTime.now());
            progress.setProgressPercentage(100);

            // Save progress
            userModuleProgressRepository.save(progress);

            // Unlock next module if exists
            unlockNextModule(userId, progress.getModule());

            // Update course progress
            updateCourseProgress(userId, progress.getModule().getCourse().getId());

            log.info("Successfully completed module {} for user {} and unlocked next module if available",
                    moduleId, userId);

            return progress;
        }

        log.info("Module {} progress for user {} is {}%, not yet complete",
                moduleId, userId, progress.getProgressPercentage());
        return null;
    }

    /**
     * Unlocks the next module in sequence
     */
    private void unlockNextModule(Long userId, Module completedModule) {
        Course course = completedModule.getCourse();
        List<Module> modules = course.getModules();

        long currentModuleId = completedModule.getId();
        long nextModuleId = currentModuleId + 1;

        final long tempModuleId = nextModuleId;

        UserModuleProgress nextModuleProgress = userModuleProgressRepository
                .findByUserIdAndModuleId(userId, nextModuleId)
                .orElseGet(() -> {
                    UserModuleProgress newProgress = new UserModuleProgress();
                    newProgress.setUser(userRepository.findById(userId).orElseThrow(
                            () -> new ResourceNotFoundException("User not found")));
                    Module nextModule = moduleService.getModuleById(tempModuleId);
                    newProgress.setModule(nextModule);

                    int totalSubmodules = countLearningItems(nextModule);
                    newProgress.setTotalSubmodules(totalSubmodules);

                    return newProgress;
                });

        nextModuleProgress.setState(UserModuleProgress.ModuleState.UNLOCKED);

        Module nextModule = nextModuleProgress.getModule();
        if (nextModule.getKeyTerms() != null && !nextModule.getKeyTerms().isEmpty() &&
                (nextModuleProgress.getUnlockedTerms() == null || nextModuleProgress.getUnlockedTerms().isEmpty())) {
            nextModuleProgress.setActiveTerm(0);
            nextModuleProgress.unlockTerm(0);
        }

        userModuleProgressRepository.save(nextModuleProgress);

        log.info("Successfully unlocked module {} for user {}", nextModuleId, userId);
    }

    private int countLearningItems(Module module) {
        int count = 0;

        if (module.getSubModules() != null) {
            count += module.getSubModules().size();
        }

        if (module.getVideoUrls() != null) {
            count += module.getVideoUrls().size();
        }

        if (module.getQuizzes() != null) {
            count += module.getQuizzes().size();
        }

        if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty()) {
            count += module.getKeyTerms().size();
        }

        return Math.max(count, 1);
    }

    private void updateCourseProgress(Long userId, Long courseId) {
        UserCourseProgress courseProgress = userCourseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course progress not found"));

        Course course = courseProgress.getCourse();
        List<Module> allModules = course.getModules();

        if (allModules == null || allModules.isEmpty()) {
            return;
        }

        List<UserModuleProgress> moduleProgressList = userModuleProgressRepository
                .findByUserIdAndModuleCourseId(userId, courseId);

        int completedModules = 0;
        int totalModules = allModules.size();
        int totalEarnedXP = 0;

        double totalProgressPercentage = 0;

        for (UserModuleProgress moduleProgress : moduleProgressList) {
            if (moduleProgress.getState() == UserModuleProgress.ModuleState.COMPLETED) {
                completedModules++;
            }
            totalEarnedXP += moduleProgress.getEarnedXP();
            totalProgressPercentage += moduleProgress.getProgressPercentage();
        }

        int progressPercentage =
                moduleProgressList.isEmpty() ? 0 : (int) (totalProgressPercentage / moduleProgressList.size());

        courseProgress.setProgressPercentage(progressPercentage);
        courseProgress.setEarnedXP(totalEarnedXP);

        if (completedModules == totalModules) {
            courseProgress.setState(UserCourseProgress.ProgressState.COMPLETED);
            courseProgress.setCompletedAt(LocalDateTime.now());
            courseProgress.setProgressPercentage(100);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + 100);
            courseProgress.setEarnedXP(courseProgress.getEarnedXP() + 100);

            user.getCompletedCourses().add(courseId);
            userRepository.save(user);
        }

        userCourseProgressRepository.save(courseProgress);
    }

    @Transactional
    public ResourceCompletionResponse completeTermResource(Long userId, Long moduleId,
                                                           Integer termIndex, String resourceType) {
        log.info("Completing {} for user {} module {} term {}",
                resourceType, userId, moduleId, termIndex);

        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Module module = progress.getModule();

        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            throw new IllegalArgumentException("Invalid term index: " + termIndex);
        }

        if (!progress.isTermUnlocked(termIndex)) {
            throw new IllegalArgumentException("Term is not unlocked: " + termIndex);
        }

        Map<String, Object> termResources = getTermResources(progress, termIndex);
        if (termResources == null) {
            termResources = new HashMap<>();
        }

        ResourceCompletionResponse response = new ResourceCompletionResponse();
        response.setSuccess(true);
        response.setResourceType(resourceType);
        response.setResourceCompleted(true);
        response.setTermIndex(termIndex);

        boolean resourceCompleted = false;
        switch (resourceType.toLowerCase()) {
            case "article":
                resourceCompleted = completeArticleResource(userId, moduleId, termIndex, termResources);
                break;
            case "video":
                resourceCompleted = completeVideoResource(userId, moduleId, termIndex, termResources);
                break;
            case "quiz":
                resourceCompleted = completeQuizResource(userId, moduleId, termIndex, termResources);
                break;
            default:
                log.warn("Unknown resource type: {}", resourceType);
                response.setSuccess(false);
                response.setResourceCompleted(false);
                return response;
        }

        saveTermResources(userId, moduleId, termIndex, termResources);

        boolean isTermCompleted = false;
        boolean nextTermUnlocked = false;
        Integer nextTermIndex = null;

        if (checkAllResourcesCompleted(termResources)) {
            log.info("All resources completed for term {}, automatically completing term", termIndex);

            if (!progress.isTermCompleted(termIndex)) {
                completeKeyTerm(userId, moduleId, termIndex);
                isTermCompleted = true;

                if (termIndex + 1 < module.getKeyTerms().size()) {
                    nextTermIndex = termIndex + 1;
                    nextTermUnlocked = progress.isTermUnlocked(nextTermIndex);
                }
            } else {
                isTermCompleted = true;
            }
        }

        progress = getModuleProgress(userId, moduleId);

        response.setTermCompleted(isTermCompleted);
        response.setNextTermUnlocked(nextTermUnlocked);
        response.setNextTermIndex(nextTermIndex);
        response.setModuleProgressPercentage(progress.getProgressPercentage());
        response.setModuleCompleted(progress.getState() == UserModuleProgress.ModuleState.COMPLETED);

        return response;
    }

    public boolean checkAllResourcesCompleted(Map<String, Object> termResources) {
        boolean articleCompleted = true;
        boolean videoCompleted = true;
        boolean quizCompleted = true;

        if (termResources.containsKey("subModuleId")) {
            articleCompleted = Boolean.TRUE.equals(termResources.get("articleCompleted"));
        }

        if (termResources.containsKey("videoId")) {
            videoCompleted = Boolean.TRUE.equals(termResources.get("videoCompleted"));
        }

        if (termResources.containsKey("quizId")) {
            quizCompleted = Boolean.TRUE.equals(termResources.get("quizCompleted"));
        }

        return articleCompleted && videoCompleted && quizCompleted;
    }

    private boolean completeArticleResource(Long userId, Long moduleId, Integer termIndex,
                                            Map<String, Object> termResources) {
        if (!termResources.containsKey("subModuleId")) {
            log.warn("No article found for term {}", termIndex);
            return false;
        }

        Long subModuleId = Long.valueOf(termResources.get("subModuleId").toString());

        termResources.put("articleCompleted", true);
        termResources.put("articleProgress", 100);

        try {
            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndSubModuleIdAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, subModuleId, termIndex)
                    .ifPresent(step -> {
                        step.complete();
                        userModuleStepProgressRepository.save(step);
                    });
        } catch (Exception e) {
            log.error("Error updating article step progress: {}", e.getMessage());
        }

        if (!Boolean.TRUE.equals(termResources.get("articleCompletedBefore"))) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Add 10 XP for article completion
            user.setXp(user.getXp() + 10);
            userRepository.save(user);

            // Mark as previously completed to avoid giving XP again
            termResources.put("articleCompletedBefore", true);
        }

        return true;
    }

    private boolean completeVideoResource(Long userId, Long moduleId, Integer termIndex,
                                          Map<String, Object> termResources) {
        if (!termResources.containsKey("videoId")) {
            log.warn("No video found for term {}", termIndex);
            return false;
        }

        // Get the video ID
        String videoId = termResources.get("videoId").toString();

        // Mark video as completed in term resources
        termResources.put("videoCompleted", true);
        termResources.put("videoProgress", 100);

        // Also update step progress if available
        try {
            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndVideoIdAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.VIDEO, videoId, termIndex)
                    .ifPresent(step -> {
                        step.complete();
                        userModuleStepProgressRepository.save(step);
                    });
        } catch (Exception e) {
            log.error("Error updating video step progress: {}", e.getMessage());
        }

        // Add XP for video completion if not already completed
        if (!Boolean.TRUE.equals(termResources.get("videoCompletedBefore"))) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Add 15 XP for video completion
            user.setXp(user.getXp() + 15);
            userRepository.save(user);

            // Mark as previously completed to avoid giving XP again
            termResources.put("videoCompletedBefore", true);
        }

        return true;
    }

    private boolean completeQuizResource(Long userId, Long moduleId, Integer termIndex,
                                         Map<String, Object> termResources) {
        if (!termResources.containsKey("quizId")) {
            log.warn("No quiz found for term {}", termIndex);
            return false;
        }

        // Get the quiz ID
        Long quizId = Long.valueOf(termResources.get("quizId").toString());

        // Mark quiz as completed in term resources
        termResources.put("quizCompleted", true);

        // Get quiz score if available (default to passing score if not specified)
        int score = termResources.containsKey("quizScore")
                ? Integer.parseInt(termResources.get("quizScore").toString())
                : 70;

        // Also update step progress if available
        try {
            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndQuizIdAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.QUIZ, quizId, termIndex)
                    .ifPresent(step -> {
                        step.updateQuizScore(score);
                        userModuleStepProgressRepository.save(step);
                    });
        } catch (Exception e) {
            log.error("Error updating quiz step progress: {}", e.getMessage());
        }

        // Add XP for quiz completion if not already completed
        if (!Boolean.TRUE.equals(termResources.get("quizCompletedBefore"))) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // Add XP based on score (1 XP per percentage point)
            user.setXp(user.getXp() + score);
            userRepository.save(user);

            // Mark as previously completed to avoid giving XP again
            termResources.put("quizCompletedBefore", true);
        }

        return true;
    }

    public Map<String, Object> getTermResources(UserModuleProgress progress, Integer termIndex) {
        try {
            if (progress.getTermResourcesData() != null && !progress.getTermResourcesData().isEmpty()) {
                Map<String, Object> allTermResources = objectMapper.readValue(
                        progress.getTermResourcesData(), Map.class);

                if (allTermResources.containsKey(termIndex.toString())) {
                    return (Map<String, Object>) allTermResources.get(termIndex.toString());
                }
            }
        } catch (Exception e) {
            log.error("Error retrieving term resources: {}", e.getMessage());
        }

        return new HashMap<>();
    }

    @Transactional
    public void updateResourceProgress(Long userId, Long moduleId, Integer termIndex,
                                       String resourceType, int progressPercentage) {
        log.info("Updating {} progress to {}% for user {} module {} term {}",
                resourceType, progressPercentage, userId, moduleId, termIndex);

        // Get module progress and term resources
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Map<String, Object> termResources = getTermResources(progress, termIndex);

        if (termResources == null) {
            termResources = new HashMap<>();
        }

        // Update progress for the specific resource type
        switch (resourceType.toLowerCase()) {
            case "article":
                if (termResources.containsKey("subModuleId")) {
                    // Update progress percentage
                    termResources.put("articleProgress", progressPercentage);
                    termResources.put("articleStarted", true);

                    // Mark as completed if 100%
                    if (progressPercentage >= 100) {
                        termResources.put("articleCompleted", true);
                    }

                    // Update step progress if available
                    Long subModuleId = Long.valueOf(termResources.get("subModuleId").toString());
                    updateArticleStepProgress(userId, moduleId, termIndex, subModuleId, progressPercentage);
                }
                break;

            case "video":
                if (termResources.containsKey("videoId")) {
                    // Update progress percentage
                    termResources.put("videoProgress", progressPercentage);
                    termResources.put("videoStarted", true);

                    // Mark as completed if 100%
                    if (progressPercentage >= 100) {
                        termResources.put("videoCompleted", true);
                    }

                    // Update step progress if available
                    String videoId = termResources.get("videoId").toString();
                    updateVideoStepProgress(userId, moduleId, termIndex, videoId, progressPercentage);
                }
                break;

            default:
                log.warn("Resource type not supported for progress updates: {}", resourceType);
                return;
        }

        // Save updated resources
        saveTermResources(userId, moduleId, termIndex, termResources);

        // Check if all resources are completed and if the term should be automatically completed
        if (progressPercentage >= 100 && checkAllResourcesCompleted(termResources)) {
            log.info("All resources completed for term {}, automatically completing term", termIndex);

            // Only complete if not already completed
            if (!progress.isTermCompleted(termIndex)) {
                completeKeyTerm(userId, moduleId, termIndex);
            }
        }
    }

    private void updateArticleStepProgress(Long userId, Long moduleId, Integer termIndex,
                                           Long subModuleId, int progressPercentage) {
        try {
            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndSubModuleIdAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, subModuleId, termIndex)
                    .ifPresent(step -> {
                        step.updateProgress(progressPercentage);
                        userModuleStepProgressRepository.save(step);
                    });
        } catch (Exception e) {
            log.error("Error updating article step progress: {}", e.getMessage());
        }
    }

    private void updateVideoStepProgress(Long userId, Long moduleId, Integer termIndex,
                                         String videoId, int progressPercentage) {
        try {
            userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndVideoIdAndKeyTermIndex(
                            userId, moduleId, UserModuleStepProgress.StepType.VIDEO, videoId, termIndex)
                    .ifPresent(step -> {
                        step.updateProgress(progressPercentage);
                        userModuleStepProgressRepository.save(step);
                    });
        } catch (Exception e) {
            log.error("Error updating video step progress: {}", e.getMessage());
        }
    }

    @Transactional
    public void updateQuizScore(Long userId, Long moduleId, Integer termIndex, Long quizId, int score) {
        log.info("Updating quiz score to {} for user {} module {} term {}",
                score, userId, moduleId, termIndex);

        // Get module progress and term resources
        UserModuleProgress progress = getModuleProgress(userId, moduleId);
        Map<String, Object> termResources = getTermResources(progress, termIndex);

        log.info("Term resources before update: {}", termResources);

        if (termResources == null) {
            termResources = new HashMap<>();
        }

        if (termResources.containsKey("quizId")) {
            Long existingQuizId = Long.valueOf(termResources.get("quizId").toString());

            // Verify this is the correct quiz
            if (!existingQuizId.equals(quizId)) {
                log.warn("Quiz ID mismatch: {} vs {}", existingQuizId, quizId);
                return;
            }

            // Update quiz score (keep best score)
            int existingScore = termResources.containsKey("quizScore")
                    ? Integer.parseInt(termResources.get("quizScore").toString())
                    : 0;

            if (score > existingScore) {
                termResources.put("quizScore", score);
            }

            // Mark as started and completed
            termResources.put("quizStarted", true);
            termResources.put("quizCompleted", true);

            // Update step progress if available
            try {
                userModuleStepProgressRepository.findByUserIdAndModuleIdAndStepTypeAndQuizIdAndKeyTermIndex(
                                userId, moduleId, UserModuleStepProgress.StepType.QUIZ, quizId, termIndex)
                        .ifPresent(step -> {
                            step.updateQuizScore(score);
                            userModuleStepProgressRepository.save(step);
                        });
            } catch (Exception e) {
                log.error("Error updating quiz step progress: {}", e.getMessage());
            }

            // Save updated resources
            saveTermResources(userId, moduleId, termIndex, termResources);

            // Check if all resources are completed and if the term should be automatically completed
            if (checkAllResourcesCompleted(termResources)) {
                log.info("All resources completed for term {}, automatically completing term", termIndex);

                // Only complete if not already completed
                if (!progress.isTermCompleted(termIndex)) {
                    completeKeyTerm(userId, moduleId, termIndex);
                }
            }
        }
    }
}