package com.screening.interviews.dto;

import lombok.Data;

@Data
public class CourseRequestDto {
    private String topic;
    private String difficultyLevel;
    private int moduleCount;
}