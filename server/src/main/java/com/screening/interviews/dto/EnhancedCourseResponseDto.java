package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

/**
 * DTO that combines course content with progress information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnhancedCourseResponseDto {
    // The base course information
    private CourseResponseDto course;

    // Overall course progress
    private CourseProgressDto courseProgress;

    // Progress for each module, keyed by module ID
    private Map<Long, ModuleProgressDto> moduleProgressMap;
}