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
public class ModuleDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("id")
    private Long id;

    @JsonProperty("moduleId")
    private String moduleId;

    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("duration")
    private String duration;

    @JsonProperty("complexityLevel")
    private String complexityLevel;

    @JsonProperty("keyTerms")
    private List<String> keyTerms;

    @JsonProperty("definitions")
    private List<String> definitions;

    @JsonProperty("learningObjectives")
    private List<String> learningObjectives;

    @JsonProperty("prerequisiteModules")
    private List<String> prerequisiteModules;

    // Additional constructor for Jackson with explicit parameter names
    @JsonCreator
    public ModuleDto(
            @JsonProperty("id") Long id,
            @JsonProperty("moduleId") String moduleId,
            @JsonProperty("title") String title,
            @JsonProperty("description") String description,
            @JsonProperty("duration") String duration,
            @JsonProperty("complexityLevel") String complexityLevel,
            @JsonProperty("keyTerms") List<String> keyTerms,
            @JsonProperty("definitions") List<String> definitions,
            @JsonProperty("learningObjectives") List<String> learningObjectives,
            @JsonProperty("prerequisiteModules") List<String> prerequisiteModules) {
        this.id = id;
        this.moduleId = moduleId;
        this.title = title;
        this.description = description;
        this.duration = duration;
        this.complexityLevel = complexityLevel;
        this.keyTerms = keyTerms;
        this.definitions = definitions;
        this.learningObjectives = learningObjectives;
        this.prerequisiteModules = prerequisiteModules;
    }
}