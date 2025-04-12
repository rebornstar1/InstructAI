package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class KeyTermResponseDto {
    private List<KeyTerm> keyTerms;
    private String conceptTitle;
    private String moduleTitle;
    private Long moduleId;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KeyTerm {
        private String term;
        private String definition;
    }
}