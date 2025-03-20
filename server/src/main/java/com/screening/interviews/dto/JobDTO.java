package com.screening.interviews.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class JobDTO {
    private UUID id;
    private String title;
    private String department;
    private String location;
    private String employmentType;
    private String description;
    private UUID recruiterId;
    // NEW: the test id to which this job is assigned
    private Long testId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public JobDTO() {}

    public JobDTO(UUID id, String title, String department, String location,
                  String employmentType, String description, UUID recruiterId,
                  Long testId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.location = location;
        this.employmentType = employmentType;
        this.description = description;
        this.recruiterId = recruiterId;
        this.testId = testId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }
    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }
    public void setDepartment(String department) {
        this.department = department;
    }

    public String getLocation() {
        return location;
    }
    public void setLocation(String location) {
        this.location = location;
    }

    public String getEmploymentType() {
        return employmentType;
    }
    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getRecruiterId() {
        return recruiterId;
    }
    public void setRecruiterId(UUID recruiterId) {
        this.recruiterId = recruiterId;
    }

    public Long getTestId() {
        return testId;
    }
    public void setTestId(Long testId) {
        this.testId = testId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
