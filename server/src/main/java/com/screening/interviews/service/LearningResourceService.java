package com.screening.interviews.service;

import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.client.GeminiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final GeminiClient geminiClient;

    public LearningResourceDto generateLearningResource(LearningResourceRequestDto request) {
        // Optionally, call geminiClient for dynamic generation.
        // For now, we simulate with dummy content.
        return LearningResourceDto.builder()
                .conceptTitle(request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle())
                .moduleTitle(request.getModuleTitle())
                .content("## Detailed Learning Resource\n\nThis is the generated content for " + request.getConceptTitle())
                .transcript("This is the transcript for the video explaining " + request.getConceptTitle())
                .videoUrl("http://example.com/videos/" + request.getConceptTitle().replaceAll("\\s+", "-"))
                .build();
    }
}
