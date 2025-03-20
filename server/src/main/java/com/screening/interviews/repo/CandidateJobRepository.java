package com.screening.interviews.repo;

import com.screening.interviews.model.Candidate;
import com.screening.interviews.model.CandidateJob;
import com.screening.interviews.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateJobRepository extends JpaRepository<CandidateJob, Long> {

    /**
     * Find a candidate job by candidate and job entities
     */
    Optional<CandidateJob> findByCandidateAndJob(Candidate candidate, Job job);


    /**
     * Find a candidate job by candidate ID and job ID
     */
    @Query("SELECT cj FROM CandidateJob cj WHERE cj.candidate.id = :candidateId AND cj.job.id = :jobId")
    Optional<CandidateJob> findByCandidateIdAndJobId(
            @Param("candidateId") Long candidateId,
            @Param("jobId") UUID jobId);

    /**
     * Find all candidate jobs for a specific candidate
     */
    List<CandidateJob> findByCandidateId(Long candidateId);

    /**
     * Find all candidate jobs for a specific job
     */
    List<CandidateJob> findByJobId(UUID jobId);

    /**
     * Find all candidate jobs with a specific status
     */
    List<CandidateJob> findByStatus(String status);

    /**
     * Find all candidate jobs with eager loading of related entities
     */
    @Query("SELECT cj FROM CandidateJob cj " +
            "LEFT JOIN FETCH cj.candidate " +
            "LEFT JOIN FETCH cj.job " +
            "LEFT JOIN FETCH cj.interviews i " +
            "LEFT JOIN FETCH i.interviewers " +
            "LEFT JOIN FETCH i.feedbackTemplates " +
            "WHERE cj.id = :id")
    Optional<CandidateJob> findByIdWithDetails(@Param("id") Long id);

    /**
     * Find candidate job with eager loading by candidate ID and job ID
     */
    @Query("SELECT cj FROM CandidateJob cj " +
            "LEFT JOIN FETCH cj.candidate " +
            "LEFT JOIN FETCH cj.job " +
            "LEFT JOIN FETCH cj.interviews i " +
            "LEFT JOIN FETCH i.interviewers " +
            "LEFT JOIN FETCH i.feedbackTemplates " +
            "WHERE cj.candidate.id = :candidateId AND cj.job.id = :jobId")
    Optional<CandidateJob> findByCandidateIdAndJobIdWithDetails(
            @Param("candidateId") Long candidateId,
            @Param("jobId") UUID jobId);
}

