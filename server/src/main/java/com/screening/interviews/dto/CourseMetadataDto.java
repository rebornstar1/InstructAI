package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.screening.interviews.config.PrerequisitesDeserializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
public class CourseMetadataDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("difficultyLevel")
    private String difficultyLevel;

    @JsonProperty("prerequisites")
    @JsonDeserialize(using = PrerequisitesDeserializer.class)
    private Object prerequisites;

    // Additional constructor for Jackson with explicit parameter names
    @JsonCreator
    public CourseMetadataDto(
            @JsonProperty("title") String title,
            @JsonProperty("description") String description,
            @JsonProperty("difficultyLevel") String difficultyLevel,
            @JsonProperty("prerequisites") Object prerequisites) {
        this.title = title;
        this.description = description;
        this.difficultyLevel = difficultyLevel;
        this.prerequisites = prerequisites;
    }
}