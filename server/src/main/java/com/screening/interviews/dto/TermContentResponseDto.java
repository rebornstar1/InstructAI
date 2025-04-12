package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for returning the generated content for a specific term
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TermContentResponseDto {

    /**
     * The term for which content was generated
     */
    private String term;

    /**
     * The definition of the term
     */
    private String definition;

    /**
     * The generated submodule containing an article about the term
     */
    private SubModuleDto subModule;

    /**
     * The generated quiz for testing knowledge about the term
     */
    private QuizDto quiz;

    /**
     * URL to a relevant educational video about the term
     */
    private String videoUrl;
}