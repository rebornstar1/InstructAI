package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackTemplateDto {
    private Long id;
    private String template;
}