package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CourseMetadataDto {
    private String title;
    private String description;
    private String difficultyLevel;
    private List<String> prerequisites;
}
