package com.screening.interviews.repo;

import com.screening.interviews.model.FeedbackTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackTemplateRepository extends JpaRepository<FeedbackTemplate, Long> {
    List<FeedbackTemplate> findByInterview_InterviewId(Long interviewId);
}