package com.screening.interviews.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor  // Required for Jackson deserialization
@AllArgsConstructor // Required for @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class KeyTermResponseDto {
    private List<KeyTerm> keyTerms;
    private String conceptTitle;
    private String moduleTitle;
    private Long moduleId;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class KeyTerm {
        private String term;
        private String definition;
    }
}