package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProgressSummaryDto {
    private int totalCourses;
    private int coursesInProgress;
    private int coursesCompleted;
    private int totalModulesCompleted;
    private int totalXP;
    private List<CourseProgressDto> recentCourses;
}