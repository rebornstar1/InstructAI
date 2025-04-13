package com.screening.interviews.service;

import com.screening.interviews.model.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.*;
import com.screening.interviews.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserModuleStepProgressService {

    private final UserModuleStepProgressRepository stepProgressRepository;
    private final UserModuleProgressRepository moduleProgressRepository;
    private final UserCourseProgressRepository courseProgressRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final SubModuleRepository subModuleRepository;
    private final QuizRepository quizRepository;
    private final ProgressService progressService;

    /**
     * Initialize step progress tracking for a module
     * This should be called when a user starts a module
     */
    @Transactional
    public void initializeModuleStepProgress(Long userId, Long moduleId) {
        log.info("Initializing step progress for user {} and module {}", userId, moduleId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        UserModuleProgress moduleProgress = moduleProgressRepository.findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        // Create step progress entries for all submodules (articles)
        if (module.getSubModules() != null) {
            for (SubModule subModule : module.getSubModules()) {
                createArticleStepProgress(user, module, moduleProgress, subModule, null);
            }
        }

        // Create step progress entries for all quizzes
        if (module.getQuizzes() != null) {
            for (Quiz quiz : module.getQuizzes()) {
                createQuizStepProgress(user, module, moduleProgress, quiz, null);
            }
        }

        // Create step progress entries for all videos
        if (module.getVideoUrls() != null) {
            for (String videoUrl : module.getVideoUrls()) {
                String videoId = extractVideoId(videoUrl);
                createVideoStepProgress(user, module, moduleProgress, videoId, null);
            }
        }

        // If the module has key terms, create step progress entries for each term
        if (module.getKeyTerms() != null && !module.getKeyTerms().isEmpty()) {
            for (int i = 0; i < module.getKeyTerms().size(); i++) {
                // Only create step progress for unlocked terms
                if (moduleProgress.isTermUnlocked(i)) {
                    createKeyTermStepProgress(user, module, moduleProgress, i);
                }
            }
        }

        log.info("Step progress initialized for module {}", moduleId);
    }

    /**
     * Create a step progress entry for an article (submodule)
     */
    @Transactional
    public UserModuleStepProgress createArticleStepProgress(
            User user, Module module, UserModuleProgress moduleProgress,
            SubModule subModule, Integer keyTermIndex) {

        // Check if entry already exists
        Optional<UserModuleStepProgress> existingProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
                        user.getId(), module.getId(),
                        UserModuleStepProgress.StepType.ARTICLE, subModule.getId());

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        UserModuleStepProgress stepProgress = UserModuleStepProgress.builder()
                .user(user)
                .module(module)
                .userModuleProgress(moduleProgress)
                .subModule(subModule)
                .stepType(UserModuleStepProgress.StepType.ARTICLE)
                .keyTermIndex(keyTermIndex)
                .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                .readProgressPercentage(0)
                .build();

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Create a step progress entry for a quiz
     */
    @Transactional
    public UserModuleStepProgress createQuizStepProgress(
            User user, Module module, UserModuleProgress moduleProgress,
            Quiz quiz, Integer keyTermIndex) {

        // Check if entry already exists
        Optional<UserModuleStepProgress> existingProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndQuizId(
                        user.getId(), module.getId(),
                        UserModuleStepProgress.StepType.QUIZ, quiz.getId());

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        UserModuleStepProgress stepProgress = UserModuleStepProgress.builder()
                .user(user)
                .module(module)
                .userModuleProgress(moduleProgress)
                .quiz(quiz)
                .stepType(UserModuleStepProgress.StepType.QUIZ)
                .keyTermIndex(keyTermIndex)
                .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                .build();

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Create a step progress entry for a video
     */
    @Transactional
    public UserModuleStepProgress createVideoStepProgress(
            User user, Module module, UserModuleProgress moduleProgress,
            String videoId, Integer keyTermIndex) {

        // Check if entry already exists
        Optional<UserModuleStepProgress> existingProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndVideoId(
                        user.getId(), module.getId(),
                        UserModuleStepProgress.StepType.VIDEO, videoId);

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        UserModuleStepProgress stepProgress = UserModuleStepProgress.builder()
                .user(user)
                .module(module)
                .userModuleProgress(moduleProgress)
                .videoId(videoId)
                .stepType(UserModuleStepProgress.StepType.VIDEO)
                .keyTermIndex(keyTermIndex)
                .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                .watchProgressPercentage(0)
                .build();

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Create a parent step progress entry for a key term
     */
    @Transactional
    public UserModuleStepProgress createKeyTermStepProgress(
            User user, Module module, UserModuleProgress moduleProgress,
            Integer keyTermIndex) {

        // Check if entry already exists
        Optional<UserModuleStepProgress> existingProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndKeyTermIndex(
                        user.getId(), module.getId(),
                        UserModuleStepProgress.StepType.KEY_TERM, keyTermIndex);

        if (existingProgress.isPresent()) {
            return existingProgress.get();
        }

        UserModuleStepProgress stepProgress = UserModuleStepProgress.builder()
                .user(user)
                .module(module)
                .userModuleProgress(moduleProgress)
                .stepType(UserModuleStepProgress.StepType.KEY_TERM)
                .keyTermIndex(keyTermIndex)
                .status(UserModuleStepProgress.StepStatus.NOT_STARTED)
                .build();

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Complete an article step and update related progress
     */
    @Transactional
    public UserModuleStepProgress completeArticle(Long userId, Long moduleId, Long subModuleId) {
        log.info("Marking article as completed for user {} and submodule {}", userId, subModuleId);

        UserModuleStepProgress stepProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
                        userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, subModuleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article progress not found"));

        // Only proceed if not already completed
        if (stepProgress.getStatus() != UserModuleStepProgress.StepStatus.COMPLETED) {
            // Mark as completed
            stepProgress.complete();

            // Award XP (10 XP per article)
            awardXP(userId, 10, stepProgress);

            // Update module progress
            updateModuleProgress(userId, moduleId);

            // If this article is part of a key term, check if all steps for the term are completed
            if (stepProgress.getKeyTermIndex() != null) {
                checkKeyTermCompletion(userId, moduleId, stepProgress.getKeyTermIndex());
            }
        }

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Complete a video step and update related progress
     */
    @Transactional
    public UserModuleStepProgress completeVideo(Long userId, Long moduleId, String videoId) {
        log.info("Marking video as completed for user {} and video {}", userId, videoId);

        UserModuleStepProgress stepProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndVideoId(
                        userId, moduleId, UserModuleStepProgress.StepType.VIDEO, videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video progress not found"));

        // Only proceed if not already completed
        if (stepProgress.getStatus() != UserModuleStepProgress.StepStatus.COMPLETED) {
            // Mark as completed
            stepProgress.complete();

            // Award XP (15 XP per video)
            awardXP(userId, 15, stepProgress);

            // Update module progress
            updateModuleProgress(userId, moduleId);

            // If this video is part of a key term, check if all steps for the term are completed
            if (stepProgress.getKeyTermIndex() != null) {
                checkKeyTermCompletion(userId, moduleId, stepProgress.getKeyTermIndex());
            }
        }

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Complete a quiz step and update related progress
     */
    @Transactional
    public UserModuleStepProgress completeQuiz(Long userId, Long moduleId, Long quizId, int score) {
        log.info("Marking quiz as completed for user {} and quiz {} with score {}", userId, quizId, score);

        UserModuleStepProgress stepProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndQuizId(
                        userId, moduleId, UserModuleStepProgress.StepType.QUIZ, quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz progress not found"));

        boolean isFirstCompletion = stepProgress.getStatus() != UserModuleStepProgress.StepStatus.COMPLETED;
        boolean isImprovedScore = !isFirstCompletion &&
                (stepProgress.getBestScore() == null || score > stepProgress.getBestScore());

        // Update quiz progress
        stepProgress.updateQuizScore(score);

        // Calculate XP to award
        if (isFirstCompletion) {
            // First time completion: 1 XP per percentage point
            awardXP(userId, score, stepProgress);
        } else if (isImprovedScore && stepProgress.getBestScore() != null) {
            // Improved score: XP for the improvement
            int improvement = score - stepProgress.getBestScore();
            if (improvement > 0) {
                awardXP(userId, improvement, stepProgress);
            }
        }

        // Update module progress
        updateModuleProgress(userId, moduleId);

        // If this quiz is part of a key term, check if all steps for the term are completed
        if (stepProgress.getKeyTermIndex() != null) {
            checkKeyTermCompletion(userId, moduleId, stepProgress.getKeyTermIndex());
        }

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Update article progress percentage
     */
    @Transactional
    public UserModuleStepProgress updateArticleProgress(Long userId, Long moduleId, Long subModuleId, int percentage) {
        UserModuleStepProgress stepProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
                        userId, moduleId, UserModuleStepProgress.StepType.ARTICLE, subModuleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article progress not found"));

        // Update progress
        stepProgress.updateProgress(percentage);

        // If completed, award XP and update module progress
        if (percentage >= 100 && stepProgress.getStatus() == UserModuleStepProgress.StepStatus.COMPLETED) {
            // Award XP if this is the first time completing
            if (stepProgress.getEarnedXP() == 0) {
                // 10 XP per article
                awardXP(userId, 10, stepProgress);
            }

            // Update module progress
            updateModuleProgress(userId, moduleId);

            // If this article is part of a key term, check if all steps for the term are completed
            if (stepProgress.getKeyTermIndex() != null) {
                checkKeyTermCompletion(userId, moduleId, stepProgress.getKeyTermIndex());
            }
        }

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Update video progress percentage
     */
    @Transactional
    public UserModuleStepProgress updateVideoProgress(Long userId, Long moduleId, String videoId, int percentage) {
        UserModuleStepProgress stepProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndVideoId(
                        userId, moduleId, UserModuleStepProgress.StepType.VIDEO, videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video progress not found"));

        // Update progress
        stepProgress.updateProgress(percentage);

        // If completed, award XP and update module progress
        if (percentage >= 100 && stepProgress.getStatus() == UserModuleStepProgress.StepStatus.COMPLETED) {
            // Award XP if this is the first time completing
            if (stepProgress.getEarnedXP() == 0) {
                // 15 XP per video
                awardXP(userId, 15, stepProgress);
            }

            // Update module progress
            updateModuleProgress(userId, moduleId);

            // If this video is part of a key term, check if all steps for the term are completed
            if (stepProgress.getKeyTermIndex() != null) {
                checkKeyTermCompletion(userId, moduleId, stepProgress.getKeyTermIndex());
            }
        }

        return stepProgressRepository.save(stepProgress);
    }

    /**
     * Check if all steps for a key term are completed and update the key term status
     */
    @Transactional
    public void checkKeyTermCompletion(Long userId, Long moduleId, Integer keyTermIndex) {
        log.info("Checking key term completion for user {} and term index {}", userId, keyTermIndex);

        // Get key term step progress
        UserModuleStepProgress keyTermProgress = stepProgressRepository
                .findByUserIdAndModuleIdAndStepTypeAndKeyTermIndex(
                        userId, moduleId, UserModuleStepProgress.StepType.KEY_TERM, keyTermIndex)
                .orElseThrow(() -> new ResourceNotFoundException("Key term progress not found"));

        // Get all steps for this key term
        List<UserModuleStepProgress> termSteps = stepProgressRepository
                .findByUserIdAndModuleIdAndKeyTermIndex(userId, moduleId, keyTermIndex);

        // Check if all required steps are completed
        boolean allCompleted = true;
        for (UserModuleStepProgress step : termSteps) {
            // Skip the key term itself
            if (step.getStepType() == UserModuleStepProgress.StepType.KEY_TERM) {
                continue;
            }

            if (step.getStatus() != UserModuleStepProgress.StepStatus.COMPLETED) {
                allCompleted = false;
                break;
            }
        }

        // If all steps are completed, mark the key term as completed
        if (allCompleted && keyTermProgress.getStatus() != UserModuleStepProgress.StepStatus.COMPLETED) {
            log.info("All steps completed for key term {} - marking term as completed", keyTermIndex);

            // Mark key term as completed
            keyTermProgress.complete();
            stepProgressRepository.save(keyTermProgress);

            // Call the existing progress service to complete the term
            // This will handle unlocking the next term and updating module progress
            progressService.completeKeyTerm(userId, moduleId, keyTermIndex);

            // Award XP for completing the key term (25 XP per term)
            awardXP(userId, 25, keyTermProgress);
        }
    }

    /**
     * Update module progress based on completed steps
     */
    @Transactional
    public void updateModuleProgress(Long userId, Long moduleId) {
        UserModuleProgress moduleProgress = moduleProgressRepository
                .findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        // Count completed steps (excluding KEY_TERM type which is a parent step)
        List<UserModuleStepProgress> completedSteps = stepProgressRepository
                .findByUserIdAndModuleIdAndStatusAndStepTypeNot(
                        userId, moduleId,
                        UserModuleStepProgress.StepStatus.COMPLETED,
                        UserModuleStepProgress.StepType.KEY_TERM);

        // Count total steps (excluding KEY_TERM type)
        long totalSteps = stepProgressRepository.countByUserIdAndModuleIdAndStepTypeNot(
                userId, moduleId, UserModuleStepProgress.StepType.KEY_TERM);

        // Update module progress
        moduleProgress.setCompletedSubmodules(completedSteps.size());

        // Calculate percentage
        if (totalSteps > 0) {
            int percentage = (int) ((completedSteps.size() * 100) / totalSteps);
            moduleProgress.setProgressPercentage(percentage);
        }

        // Check if all steps are completed
        boolean allStepsCompleted = stepProgressRepository
                .areAllStepsCompleted(userId, moduleId);

        if (allStepsCompleted) {
            // Mark module as completed
            moduleProgress.setState(UserModuleProgress.ModuleState.COMPLETED);
            moduleProgress.setCompletedAt(LocalDateTime.now());
            moduleProgress.setProgressPercentage(100);

            // Delegate to progress service to handle next module unlocking
            progressService.checkAndCompleteModule(userId, moduleId);
        }

        moduleProgressRepository.save(moduleProgress);
    }

    /**
     * Get all steps for a module
     */
    public List<UserModuleStepProgress> getStepsForModule(Long userId, Long moduleId) {
        return stepProgressRepository.findByUserIdAndModuleId(userId, moduleId);
    }

    /**
     * Get all steps for a key term
     */
    public List<UserModuleStepProgress> getStepsForKeyTerm(Long userId, Long moduleId, Integer termIndex) {
        return stepProgressRepository.findByUserIdAndModuleIdAndKeyTermIndex(userId, moduleId, termIndex);
    }

    /**
     * Check if a key term is completed
     */
    public boolean isKeyTermCompleted(Long userId, Long moduleId, Integer termIndex) {
        UserModuleProgress progress = moduleProgressRepository
                .findByUserIdAndModuleId(userId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module progress not found"));

        return progress.isTermCompleted(termIndex);
    }

    /**
     * Award XP for completing steps and update user and progress records
     */
    @Transactional
    public void awardXP(Long userId, int xpAmount, UserModuleStepProgress stepProgress) {
        // Update step progress XP
        stepProgress.setEarnedXP(stepProgress.getEarnedXP() + xpAmount);

        // Update user XP
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setXp(user.getXp() + xpAmount);
        userRepository.save(user);

        // Update module progress XP
        UserModuleProgress moduleProgress = stepProgress.getUserModuleProgress();
        moduleProgress.setEarnedXP(moduleProgress.getEarnedXP() + xpAmount);
        moduleProgressRepository.save(moduleProgress);

        // Update course progress XP
        Long courseId = stepProgress.getModule().getCourse().getId();
        UserCourseProgress courseProgress = courseProgressRepository
                .findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course progress not found"));
        courseProgress.setEarnedXP(courseProgress.getEarnedXP() + xpAmount);
        courseProgressRepository.save(courseProgress);
    }

    /**
     * Extract video ID from a YouTube URL
     */
    private String extractVideoId(String videoUrl) {
        if (videoUrl == null || videoUrl.isEmpty()) {
            return null;
        }

        // Extract video ID from YouTube URL
        if (videoUrl.contains("youtube.com/watch")) {
            return videoUrl.split("v=")[1].split("&")[0];
        } else if (videoUrl.contains("youtu.be/")) {
            return videoUrl.split("youtu.be/")[1].split("\\?")[0];
        }

        // If not a standard YouTube URL, just return the whole URL as the ID
        return videoUrl;
    }
}