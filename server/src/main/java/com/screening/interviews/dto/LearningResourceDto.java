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
public class LearningResourceDto {
    private String conceptTitle;
    private String moduleTitle;
    private String content;       // Detailed learning content (e.g. markdown)
    private String transcript;    // Transcript for video content
    private List<String> videoUrls;      // URL for a generated video resource
    private List<SubModuleDto> subModules; // List of submodules with extra details
    private List<QuizDto> quizzes; // List of quizzes to test comprehension
}