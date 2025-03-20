package com.screening.interviews.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class JobApplicationDTO {

    private UUID id;
    private UUID candidateId;
    private UUID jobId; // Representing the associated job's id
    private String status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    // Constructors
    public JobApplicationDTO() {}

    public JobApplicationDTO(UUID id, UUID candidateId, UUID jobId, String status,
                             LocalDateTime appliedAt, LocalDateTime updatedAt) {
        this.id = id;
        this.candidateId = candidateId;
        this.jobId = jobId;
        this.status = status;
        this.appliedAt = appliedAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(UUID candidateId) {
        this.candidateId = candidateId;
    }

    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}