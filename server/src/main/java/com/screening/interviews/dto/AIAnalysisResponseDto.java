package com.screening.interviews.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AIAnalysisResponseDto {
    private String overallSummary;
    private StrengthsWeaknesses strengthsWeaknesses;
    private FitAssessment fitAssessment;
    private String recommendedAction;
    private int confidenceScore;

    @Data
    @Builder
    public static class StrengthsWeaknesses {
        private List<AreaDetail> keyStrengths;
        private List<AreaDetail> keyWeaknesses;
    }

    @Data
    @Builder
    public static class AreaDetail {
        private String area;
        private String details;
    }

    @Data
    @Builder
    public static class FitAssessment {
        private int cultureFit;
        private int technicalFit;
        private int growthPotential;
    }
}