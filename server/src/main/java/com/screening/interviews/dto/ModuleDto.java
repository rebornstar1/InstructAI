package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ModuleDto {
    private String moduleId;
    private String title;
    private String description;
    private String duration;
    private List<String> learningObjectives;
}
