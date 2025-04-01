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
public class CourseResponseDto {
    private Long id;                      // Added course ID
    private String courseUuid;            // Added course UUID
    private CourseMetadataDto courseMetadata;
    private List<ModuleDto> modules;
}