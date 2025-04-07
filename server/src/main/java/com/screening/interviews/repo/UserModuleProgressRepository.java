package com.screening.interviews.repo;

import com.screening.interviews.model.UserModuleProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserModuleProgressRepository extends JpaRepository<UserModuleProgress, Long> {
    // Fixed the method name to use 'id' instead of 'courseId' since that's the property name in Course entity
    List<UserModuleProgress> findByUserIdAndModuleCourseId(Long userId, Long courseId);

    Optional<UserModuleProgress> findByUserIdAndModuleId(Long userId, Long moduleId);

    @Query("SELECT COUNT(ump) FROM UserModuleProgress ump WHERE ump.user.id = ?1 AND ump.state = 'COMPLETED'")
    int countCompletedModulesByUserId(Long userId);

    List<UserModuleProgress> findByModuleId(Long moduleId);
}