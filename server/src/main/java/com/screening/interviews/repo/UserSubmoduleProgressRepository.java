package com.screening.interviews.repo;

import com.screening.interviews.model.UserSubmoduleProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubmoduleProgressRepository extends JpaRepository<UserSubmoduleProgress, Long> {

    // Find by user ID, module ID, content type and content ID
    Optional<UserSubmoduleProgress> findByUserIdAndModuleIdAndContentTypeAndContentId(
            Long userId, Long moduleId, UserSubmoduleProgress.ContentType contentType, String contentId);

    // Find all progress records for a user and module
    List<UserSubmoduleProgress> findByUserIdAndModuleId(Long userId, Long moduleId);

    // Find all progress records for a user, module, and content type
    List<UserSubmoduleProgress> findByUserIdAndModuleIdAndContentType(
            Long userId, Long moduleId, UserSubmoduleProgress.ContentType contentType);

    // Find all by user ID
    List<UserSubmoduleProgress> findByUserId(Long userId);

    // Find all completed content items for a module
    List<UserSubmoduleProgress> findByUserIdAndModuleIdAndCompleted(
            Long userId, Long moduleId, boolean completed);

    // Count completed items by module
    @Query("SELECT COUNT(usp) FROM UserSubmoduleProgress usp " +
            "WHERE usp.user.id = :userId AND usp.module.id = :moduleId AND usp.completed = true")
    int countCompletedItemsByUserIdAndModuleId(Long userId, Long moduleId);

    // Find by content type
    List<UserSubmoduleProgress> findByUserIdAndContentType(
            Long userId, UserSubmoduleProgress.ContentType contentType);

    // Check if a specific quiz was completed
    boolean existsByUserIdAndModuleIdAndContentTypeAndContentIdAndCompleted(
            Long userId, Long moduleId, UserSubmoduleProgress.ContentType contentType, String contentId, boolean completed);

    // Find all completed content items of a specific type
    List<UserSubmoduleProgress> findByUserIdAndContentTypeAndCompleted(
            Long userId, UserSubmoduleProgress.ContentType contentType, boolean completed);
}