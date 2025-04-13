package com.screening.interviews.repo;

import com.screening.interviews.model.UserModuleStepProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserModuleStepProgressRepository extends JpaRepository<UserModuleStepProgress, Long> {

    // Find step progress by user, module, and step type
    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepType(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType);

    // Find step progress by user, module, step type, and reference ID (submodule, quiz, or video)
    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Long subModuleId);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndQuizId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Long quizId);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndVideoId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, String videoId);

    // Find step progress for a key term and step type
    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndKeyTermIndex(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Integer keyTermIndex);

    // Find all steps for a module
    List<UserModuleStepProgress> findByUserIdAndModuleId(Long userId, Long moduleId);

    // Find all steps for a key term
    List<UserModuleStepProgress> findByUserIdAndModuleIdAndKeyTermIndex(
            Long userId, Long moduleId, Integer keyTermIndex);

    // Get all completed steps for a module
    List<UserModuleStepProgress> findByUserIdAndModuleIdAndStatus(
            Long userId, Long moduleId, UserModuleStepProgress.StepStatus status);

    // Get all completed steps for a module, excluding a certain step type
    List<UserModuleStepProgress> findByUserIdAndModuleIdAndStatusAndStepTypeNot(
            Long userId, Long moduleId,
            UserModuleStepProgress.StepStatus status,
            UserModuleStepProgress.StepType stepType);

    // Count steps for a module, excluding a certain step type
    long countByUserIdAndModuleIdAndStepTypeNot(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType);

    // Check if all required steps for a key term are completed
    @Query("SELECT COUNT(p) FROM UserModuleStepProgress p " +
            "WHERE p.user.id = :userId AND p.module.id = :moduleId " +
            "AND p.keyTermIndex = :termIndex AND p.status = 'COMPLETED' AND p.stepType <> 'KEY_TERM'")
    int countCompletedStepsByKeyTerm(
            @Param("userId") Long userId,
            @Param("moduleId") Long moduleId,
            @Param("termIndex") Integer termIndex);

    // Count total steps for a key term (excluding the KEY_TERM parent step)
    @Query("SELECT COUNT(p) FROM UserModuleStepProgress p " +
            "WHERE p.user.id = :userId AND p.module.id = :moduleId " +
            "AND p.keyTermIndex = :termIndex AND p.stepType <> 'KEY_TERM'")
    int countTotalStepsByKeyTerm(
            @Param("userId") Long userId,
            @Param("moduleId") Long moduleId,
            @Param("termIndex") Integer termIndex);

    // Check if all steps in a module are completed (excluding KEY_TERM type)
    @Query("SELECT " +
            "(SELECT COUNT(p) FROM UserModuleStepProgress p " +
            "WHERE p.user.id = :userId AND p.module.id = :moduleId " +
            "AND p.status = 'COMPLETED' AND p.stepType <> 'KEY_TERM') = " +
            "(SELECT COUNT(p) FROM UserModuleStepProgress p " +
            "WHERE p.user.id = :userId AND p.module.id = :moduleId AND p.stepType <> 'KEY_TERM')")
    boolean areAllStepsCompleted(@Param("userId") Long userId, @Param("moduleId") Long moduleId);
}