package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateComparisonRequestDto {
    private String jobDescription;
    private String resume;
}