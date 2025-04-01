package com.screening.interviews.controller;

import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.dto.QuestionDto;
import com.screening.interviews.model.Quiz;
import com.screening.interviews.repo.QuizRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    private final QuizRepository quizRepository;

    public QuizController(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    /**
     * GET /api/quizzes/module/{moduleId}
     * Retrieves all quizzes associated with the given module id.
     *
     * @param moduleId the numeric identifier of the module
     * @return a list of QuizDto objects representing the quizzes for the module
     */
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<QuizDto>> getQuizzesByModuleId(@PathVariable Long moduleId) {
        List<Quiz> quizzes = quizRepository.findByModule_Id(moduleId);
        List<QuizDto> quizDtos = quizzes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(quizDtos);
    }

    // Helper method to convert a Quiz entity to a QuizDto.
    private QuizDto convertToDto(Quiz quiz) {
        List<QuestionDto> questionDtos = new ArrayList<>();
        if (quiz.getQuestions() != null) {
            questionDtos = quiz.getQuestions().stream()
                    .map(q -> QuestionDto.builder()
                            .question(q.getQuestion())
                            .options(q.getOptions())
                            .correctAnswer(q.getCorrectAnswer())
                            .explanation(q.getExplanation())
                            .build())
                    .collect(Collectors.toList());
        }

        return QuizDto.builder()
                .quizTitle(quiz.getQuizTitle())
                .description(quiz.getDescription())
                .difficulty(quiz.getDifficulty())
                .timeLimit(quiz.getTimeLimit())
                .passingScore(quiz.getPassingScore())
                .questions(questionDtos)
                .build();
    }
}
