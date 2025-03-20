package com.screening.interviews.service;

import com.screening.interviews.model.FeedbackTemplate;
import com.screening.interviews.repo.FeedbackTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class FeedbackTemplateServiceImpl implements FeedbackTemplateService {

    private final FeedbackTemplateRepository feedbackTemplateRepository;

    @Autowired
    public FeedbackTemplateServiceImpl(FeedbackTemplateRepository feedbackTemplateRepository) {
        this.feedbackTemplateRepository = feedbackTemplateRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FeedbackTemplate> getFeedbackTemplateById(Long id) {
        return feedbackTemplateRepository.findById(id);
    }
}