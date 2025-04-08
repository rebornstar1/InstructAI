package com.screening.interviews.dto.community;

import java.time.LocalDateTime;
import java.util.List;

public class ThreadDTO {
    private Long id;
    private String name;
    private String description;
    private Long parentThreadId;
    private List<Long> subThreadIds;
    private LocalDateTime createdAt;
    private boolean active;
    private List<Long> relatedCourseIds;

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getParentThreadId() {
        return parentThreadId;
    }

    public void setParentThreadId(Long parentThreadId) {
        this.parentThreadId = parentThreadId;
    }

    public List<Long> getSubThreadIds() {
        return subThreadIds;
    }

    public void setSubThreadIds(List<Long> subThreadIds) {
        this.subThreadIds = subThreadIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<Long> getRelatedCourseIds() {
        return relatedCourseIds;
    }

    public void setRelatedCourseIds(List<Long> relatedCourseIds) {
        this.relatedCourseIds = relatedCourseIds;
    }
}