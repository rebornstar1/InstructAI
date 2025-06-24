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
public class QuizDto {
    private String quizTitle;
    private String description;
    private String difficulty;
    private String timeLimit;
    private List<QuestionDto> questions;
    private int passingScore;
}