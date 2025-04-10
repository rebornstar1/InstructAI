package com.screening.interviews.controller;

import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.service.LearningResourceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/learning-resources")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LearningResourceController {

    private final LearningResourceService learningResourceService;
    private static final Logger logger = LoggerFactory.getLogger(LearningResourceService.class);

    @PostMapping("/generate")
    public ResponseEntity<LearningResourceDto> generateLearningResource(@RequestBody LearningResourceRequestDto request) {
        LearningResourceDto resource = learningResourceService.generateLearningResource(request);
        return ResponseEntity.ok(resource);
    }


//    @PostMapping("/generate-from-resume")
//    public ResponseEntity<List<QuizDto>> generateQuizzesFromResume(
//            @RequestParam("file") MultipartFile resumeFile) {
//
//        logger.info("Received request to generate quizzes from resume: {}",
//                resumeFile.getOriginalFilename());
//
//        if (resumeFile.isEmpty()) {
//            return ResponseEntity.badRequest().build();
//        }
//
//        List<QuizDto> quizzes = learningResourceService.generateQuizzesFromResume(resumeFile);
//
//        if (quizzes.isEmpty()) {
//            logger.warn("No quizzes generated from resume");
//            return ResponseEntity.notFound().build();
//        }
//
//        logger.info("Successfully generated {} quizzes from resume", quizzes.size());
//        return ResponseEntity.ok(quizzes);
//    }

    @PostMapping("/generate-multiple-quizzes")
    public ResponseEntity<List<QuizDto>> generateMultipleQuizzes(@RequestBody List<String> concepts) {
        logger.info("Received request to generate quizzes for concepts: {}", concepts);
        List<QuizDto> quizzes = learningResourceService.generateMultipleQuiz(concepts);
        if (quizzes.isEmpty()) {
            logger.warn("No quizzes generated for the provided concepts");
            return ResponseEntity.notFound().build();
        }
        logger.info("Successfully generated {} quizzes", quizzes.size());
        return ResponseEntity.ok(quizzes);
    }

}


