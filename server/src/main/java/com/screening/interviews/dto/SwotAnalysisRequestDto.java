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
public class SwotAnalysisRequestDto {
    private String candidateName;
    private String position;
    private String resumeContent;
}
