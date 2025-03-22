package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class QuestionDto {
    private String question;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
}