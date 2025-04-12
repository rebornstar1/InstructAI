package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for requesting content generation for a specific term
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TermContentRequestDto {

    /**
     * The specific term for which content will be generated
     */
    private String term;

    /**
     * The definition of the term
     */
    private String definition;

    /**
     * The ID of the module to which this term belongs
     */
    private Long moduleId;

    /**
     * Optional context title to provide additional domain context (e.g., "Java Programming")
     */
    private String contextTitle;

    /**
     * Whether to save the generated content to the database
     * If true, the submodule, quiz, and video URL will be persisted
     * If false, they will only be returned in the response
     */
    private Boolean saveContent;
}