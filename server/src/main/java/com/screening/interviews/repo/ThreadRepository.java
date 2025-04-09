package com.screening.interviews.repo;

import com.screening.interviews.model.Thread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThreadRepository extends JpaRepository<Thread, Long> {

    List<Thread> findByParentThreadIsNull();

    List<Thread> findByParentThreadId(Long parentId);

    List<Thread> findByNameContainingIgnoreCase(String name);

    @Query("SELECT t FROM Thread t JOIN t.relatedCourses c WHERE c.id = :courseId")
    List<Thread> findByCourseId(@Param("courseId") Long courseId);

    Optional<Thread> findByNameIgnoreCase(String name);

    @Query("SELECT t FROM Thread t JOIN t.members m WHERE m.id = :userId")
    List<Thread> findByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Thread t WHERE t.parentThread IS NULL ORDER BY t.name")
    List<Thread> findAllMainThreads();
}