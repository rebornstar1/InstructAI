package com.screening.interviews.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.screening.interviews.config.PrerequisitesDeserializer;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CourseMetadataDto {
    private String title;
    private String description;
    private String difficultyLevel;

    @JsonDeserialize(using = PrerequisitesDeserializer.class)
    private Object prerequisites;
}
