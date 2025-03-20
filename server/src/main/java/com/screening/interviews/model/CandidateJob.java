package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "candidate_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "candidate_job_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    @JsonBackReference(value = "job-candidates")
    private Job job;

    @Column(name = "current_round", nullable = false)
    private Integer currentRound = 1;

    @Column(name = "status", length = 50, nullable = false)
    private String status; // e.g., "Applied", "Shortlisted", "Rejected", "Hired"

    @OneToMany(mappedBy = "candidateJob", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "candidatejob-interviews")  // Add this annotation
    private List<Interview> interviews;
}
