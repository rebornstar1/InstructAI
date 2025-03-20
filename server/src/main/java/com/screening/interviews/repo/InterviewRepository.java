package com.screening.interviews.repo;

import com.screening.interviews.model.CandidateJob;
import com.screening.interviews.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByCandidateJobOrderByRoundNumberDesc(CandidateJob candidateJob);

}
