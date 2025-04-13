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

    // Get all completed steps for a module
    List<UserModuleStepProgress> findByUserIdAndModuleIdAndStatus(
            Long userId, Long moduleId, UserModuleStepProgress.StepStatus status);


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


    List<UserModuleStepProgress> findByUserIdAndModuleId(Long userId, Long moduleId);

    List<UserModuleStepProgress> findByUserIdAndModuleIdAndKeyTermIndex(
            Long userId, Long moduleId, Integer keyTermIndex);

    // Find steps by type
    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndSubModuleId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Long subModuleId);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndVideoId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, String videoId);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndQuizId(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Long quizId);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndKeyTermIndex(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType, Integer keyTermIndex);

    // Find steps by type and key term index
    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndSubModuleIdAndKeyTermIndex(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType,
            Long subModuleId, Integer keyTermIndex);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndVideoIdAndKeyTermIndex(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType,
            String videoId, Integer keyTermIndex);

    Optional<UserModuleStepProgress> findByUserIdAndModuleIdAndStepTypeAndQuizIdAndKeyTermIndex(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType,
            Long quizId, Integer keyTermIndex);

    // Find steps by status
    List<UserModuleStepProgress> findByUserIdAndModuleIdAndStatus(
            Long userId, Long moduleId, UserModuleStepProgress.StepType status);

    List<UserModuleStepProgress> findByUserIdAndModuleIdAndStatusAndStepTypeNot(
            Long userId, Long moduleId, UserModuleStepProgress.StepStatus status,
            UserModuleStepProgress.StepType notStepType);

    // Count steps
    long countByUserIdAndModuleIdAndStepTypeNot(
            Long userId, Long moduleId, UserModuleStepProgress.StepType stepType);

    // Check if all steps are completed
    @Query("SELECT CASE WHEN COUNT(s) = 0 THEN true ELSE " +
            "CASE WHEN COUNT(s) = COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE NULL END) " +
            "THEN true ELSE false END END " +
            "FROM UserModuleStepProgress s " +
            "WHERE s.user.id = :userId AND s.module.id = :moduleId AND s.stepType <> 'KEY_TERM'")
    boolean areAllStepsCompleted(@Param("userId") Long userId, @Param("moduleId") Long moduleId);

    // Check if all steps for a key term are completed
    @Query("SELECT CASE WHEN COUNT(s) = 0 THEN true ELSE " +
            "CASE WHEN COUNT(s) = COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE NULL END) " +
            "THEN true ELSE false END END " +
            "FROM UserModuleStepProgress s " +
            "WHERE s.user.id = :userId AND s.module.id = :moduleId " +
            "AND s.keyTermIndex = :termIndex AND s.stepType <> 'KEY_TERM'")
    boolean areAllStepsCompletedForKeyTerm(
            @Param("userId") Long userId,
            @Param("moduleId") Long moduleId,
            @Param("termIndex") Integer termIndex);
}