package com.screening.interviews.repo;

import com.screening.interviews.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    // Additional query methods if needed.
    List<Quiz> findByModule_Id(Long moduleId);
    int countByModuleId(Long moduleId);
}
