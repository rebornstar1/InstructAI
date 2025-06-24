package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
public class CourseResponseDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("id")
    private Long id;

    @JsonProperty("courseUuid")
    private String courseUuid;

    @JsonProperty("courseMetadata")
    private CourseMetadataDto courseMetadata;

    @JsonProperty("modules")
    private List<ModuleDto> modules;

    // Additional constructor for Jackson with explicit parameter names
    @JsonCreator
    public CourseResponseDto(
            @JsonProperty("id") Long id,
            @JsonProperty("courseUuid") String courseUuid,
            @JsonProperty("courseMetadata") CourseMetadataDto courseMetadata,
            @JsonProperty("modules") List<ModuleDto> modules) {
        this.id = id;
        this.courseUuid = courseUuid;
        this.courseMetadata = courseMetadata;
        this.modules = modules;
    }
}