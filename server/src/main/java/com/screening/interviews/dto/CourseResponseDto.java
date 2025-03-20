package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CourseResponseDto {
    private CourseMetadataDto courseMetadata;
    private List<ModuleDto> modules;
}
