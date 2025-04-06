package com.screening.interviews.repo;

import com.screening.interviews.model.UserCourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCourseProgressRepository extends JpaRepository<UserCourseProgress, Long> {
    List<UserCourseProgress> findByUserId(Long userId);

    Optional<UserCourseProgress> findByUserIdAndCourseId(Long userId, Long courseId);

    @Query("SELECT COUNT(ucp) FROM UserCourseProgress ucp WHERE ucp.user.id = ?1 AND ucp.state = 'COMPLETED'")
    int countCompletedCoursesByUserId(Long userId);
}
