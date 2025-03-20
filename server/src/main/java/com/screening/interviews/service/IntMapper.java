package com.screening.interviews.service;

import com.screening.interviews.dto.InterviewResponseDto;
import com.screening.interviews.dto.InterviewerResponseDto;
import com.screening.interviews.model.Interview;
import com.screening.interviews.model.InterviewersInterview;
import com.screening.interviews.model.FeedbackTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface IntMapper {

    @Mapping(target = "interviewers", source = "interviewersInterviews")
    @Mapping(target = "feedbackTemplates", expression = "java(interview.getFeedbackTemplates().stream().map(FeedbackTemplate::getTemplate).collect(Collectors.toList()))")
    InterviewResponseDto toDto(Interview interview);

    @Mapping(target = "userId", source = "id.userId")
    InterviewerResponseDto toInterviewerDto(InterviewersInterview interviewer);

    List<InterviewResponseDto> toDtoList(List<Interview> interviews);
}