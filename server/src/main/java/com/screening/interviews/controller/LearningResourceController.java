package com.screening.interviews.controller;

import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.dto.QuizDto;
import com.screening.interviews.model.Quiz;
import com.screening.interviews.service.LearningResourceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/key-terms")
    public ResponseEntity<Map<String, String>> analyzeTopicAndExtractKeyTerms(
            @RequestParam String conceptTitle,
            @RequestParam String moduleTitle) {

        logger.info("Received request to analyze topic and extract key terms for concept: {}, module: {}",
                conceptTitle, moduleTitle);

        Map<String, String> keyTerms = learningResourceService.analyzeTopicAndExtractKeyTerms(conceptTitle, moduleTitle);

        if (keyTerms.isEmpty()) {
            logger.warn("No key terms extracted for the provided concept and module");
            return ResponseEntity.noContent().build();
        }

        logger.info("Successfully extracted {} key terms", keyTerms.size());
        return ResponseEntity.ok(keyTerms);
    }

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

    @PostMapping("/generate-quiz")
    public ResponseEntity<QuizDto> generateQuiz(@RequestBody String concept){
        QuizDto quiz = learningResourceService.generateQuiz(concept);

        return ResponseEntity.ok(quiz);
    }

    /**
     * Finds relevant educational videos for a specific term based on its definition
     *
     * @param term The technical term to find videos for
     * @param definition The definition of the term (will help improve search precision)
     * @return A list of YouTube video URLs related to the term and its definition
     */
    @GetMapping("/definition-videos")
    public ResponseEntity<Map<String, Object>> getDefinitionVideos(
            @RequestParam String term,
            @RequestParam(required = false) String definition) {

        logger.info("Received request to find definition videos for term: {}", term);

        // Use empty string if definition is null
        String definitionText = definition != null ? definition : "";

        List<String> videos = learningResourceService.findDefinitionVideos(term, definitionText);

        if (videos.isEmpty()) {
            logger.warn("No videos found for term: {}", term);
            return ResponseEntity.noContent().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("term", term);
        response.put("definition", definitionText);
        response.put("videos", videos);

        logger.info("Found {} videos for term: {}", videos.size(), term);
        return ResponseEntity.ok(response);
    }
}


