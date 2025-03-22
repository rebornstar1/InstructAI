package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class QuizDto {
    private String quizTitle;
    private String description;
    private String difficulty;
    private String timeLimit;
    private List<QuestionDto> questions;
    private int passingScore;
}