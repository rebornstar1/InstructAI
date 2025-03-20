package com.screening.interviews.repo;

import com.screening.interviews.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    /**
     * Find all feedback entries for a specific interview
     *
     * @param interviewId the ID of the interview
     * @return list of feedback for the specified interview
     */
    List<Feedback> findByInterviewInterviewId(Long interviewId);
}
