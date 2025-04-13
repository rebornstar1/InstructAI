package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeyTermProgressDto {
    private Long moduleId;
    private Integer termIndex;
    private String term;
    private String definition;
    private boolean isCompleted;
    private boolean isUnlocked;
    private boolean isActive;

    // Resource status flags
    private boolean contentGenerated;
    private boolean articleCompleted;
    private boolean videoCompleted;
    private boolean quizCompleted;

    // Resource details if available
    private Long subModuleId;
    private String subModuleTitle;
    private Long quizId;
    private String videoUrl;

    // Optional fields for full detail views
    private String article;
    private List<QuestionDto> quizQuestions;

    // Static builder method for creating lists of key term progress
    public static List<KeyTermProgressDto> createFromModuleProgress(
            List<String> moduleKeyTerms,
            List<String> moduleDefinitions,
            Integer activeTermIndex,
            List<Integer> unlockedTerms,
            List<Integer> completedTerms,
            Map<String, Object> termResources) {

        List<KeyTermProgressDto> result = new ArrayList<>();

        if (moduleKeyTerms == null || moduleKeyTerms.isEmpty()) {
            return result;
        }

        for (int i = 0; i < moduleKeyTerms.size(); i++) {
            String term = moduleKeyTerms.get(i);
            String definition = (moduleDefinitions != null && i < moduleDefinitions.size())
                    ? moduleDefinitions.get(i) : "";

            boolean isUnlocked = unlockedTerms != null && unlockedTerms.contains(i);
            boolean isCompleted = completedTerms != null && completedTerms.contains(i);
            boolean isActive = activeTermIndex != null && activeTermIndex == i;

            // Look up term resources if available
            Map<String, Object> resources = termResources != null ?
                    (Map<String, Object>) termResources.get(String.valueOf(i)) : null;

            KeyTermProgressDto.KeyTermProgressDtoBuilder builder = KeyTermProgressDto.builder()
                    .termIndex(i)
                    .term(term)
                    .definition(definition)
                    .isUnlocked(isUnlocked)
                    .isCompleted(isCompleted)
                    .isActive(isActive);

            // Add resource info if available
            if (resources != null) {
                builder
                        .contentGenerated(true)
                        .articleCompleted(Boolean.TRUE.equals(resources.get("articleCompleted")))
                        .videoCompleted(Boolean.TRUE.equals(resources.get("videoCompleted")))
                        .quizCompleted(Boolean.TRUE.equals(resources.get("quizCompleted")))
                        .subModuleId(resources.get("subModuleId") != null ?
                                Long.valueOf(resources.get("subModuleId").toString()) : null)
                        .subModuleTitle(resources.get("subModuleTitle") != null ?
                                resources.get("subModuleTitle").toString() : null)
                        .quizId(resources.get("quizId") != null ?
                                Long.valueOf(resources.get("quizId").toString()) : null)
                        .videoUrl(resources.get("videoUrl") != null ?
                                resources.get("videoUrl").toString() : null);
            } else {
                builder.contentGenerated(false);
            }

            result.add(builder.build());
        }

        return result;
    }
}