package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermContentUpdateDto {
    private String article;
    private QuizDto quiz;
    private String videoUrl;
    private Map<String, Object> metadata;
}