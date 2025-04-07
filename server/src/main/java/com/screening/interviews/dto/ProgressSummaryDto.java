package com.screening.interviews.dto;

import com.screening.interviews.model.UserCourseProgress;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for the progress summary dashboard
 */
@Data
@NoArgsConstructor
public class ProgressSummaryDto {
    private int totalXP;
    private int totalCourses;
    private int coursesCompleted;
    private int coursesInProgress;
    private int totalModulesCompleted;
    private List<UserCourseProgress> recentCourses;
}