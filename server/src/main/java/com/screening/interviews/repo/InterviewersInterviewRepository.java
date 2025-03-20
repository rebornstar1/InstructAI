package com.screening.interviews.repo;

import com.screening.interviews.model.InterviewersInterview;
import com.screening.interviews.model.InterviewersInterviewId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewersInterviewRepository extends JpaRepository<InterviewersInterview, InterviewersInterviewId> {
}
