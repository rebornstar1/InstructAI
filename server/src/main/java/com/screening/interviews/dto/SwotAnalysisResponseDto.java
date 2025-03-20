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
public class SwotAnalysisResponseDto {
    private String summary;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> opportunities;
    private List<String> threats;
}