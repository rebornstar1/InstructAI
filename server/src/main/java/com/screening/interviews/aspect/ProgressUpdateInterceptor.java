package com.screening.interviews.aspect;

import com.screening.interviews.model.UserModuleProgress;
import com.screening.interviews.service.ProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * Aspect that intercepts progress update methods to check for auto-completion
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ProgressUpdateInterceptor {

    private final ProgressService progressService;

    /**
     * After any submodule is completed, check if the module should be auto-completed
     */
    @AfterReturning(
            pointcut = "execution(* com.screening.interviews.service.ProgressService.completeSubmodule(..)) && args(userId, moduleId, submoduleId)",
            returning = "progress")
    public void afterSubmoduleComplete(Long userId, Long moduleId, Long submoduleId, UserModuleProgress progress) {
        log.info("Intercepted submodule completion for user {} and module {}", userId, moduleId);
        progressService.checkAndCompleteModule(userId, moduleId);
    }

    /**
     * After any quiz is completed, check if the module should be auto-completed
     */
    @AfterReturning(
            pointcut = "execution(* com.screening.interviews.service.ProgressService.completeQuiz(..)) && args(userId, moduleId, score)",
            returning = "progress")
    public void afterQuizComplete(Long userId, Long moduleId, int score, UserModuleProgress progress) {
        log.info("Intercepted quiz completion for user {} and module {}", userId, moduleId);
        progressService.checkAndCompleteModule(userId, moduleId);
    }

    /**
     * After any video is completed, check if the module should be auto-completed
     */
    @AfterReturning(
            pointcut = "execution(* com.screening.interviews.service.ProgressService.completeVideo(..)) && args(userId, moduleId, videoId)",
            returning = "progress")
    public void afterVideoComplete(Long userId, Long moduleId, String videoId, UserModuleProgress progress) {
        log.info("Intercepted video completion for user {} and module {}", userId, moduleId);
        progressService.checkAndCompleteModule(userId, moduleId);
    }

    /**
     * After module progress percentage is updated, check if the module should be auto-completed
     */
    @AfterReturning(
            pointcut = "execution(private void com.screening.interviews.service.ProgressService.updateModuleProgressPercentage(com.screening.interviews.model.UserModuleProgress))",
            argNames = "joinPoint")
    public void afterProgressUpdate() {
        log.info("Intercepted progress percentage update");
        // Since we can't access the arguments directly in this case, we'll rely on the other interception points
    }
}