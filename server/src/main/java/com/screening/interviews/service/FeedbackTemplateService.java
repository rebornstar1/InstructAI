package com.screening.interviews.service;

import com.screening.interviews.model.FeedbackTemplate;
import java.util.Optional;

public interface FeedbackTemplateService {
    Optional<FeedbackTemplate> getFeedbackTemplateById(Long id);
}