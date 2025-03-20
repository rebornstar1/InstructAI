package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InterviewerResponseDto {
    private Long userId;
    private String name;
    private String email;
}