package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.service.DocumentParserService;
import com.screening.interviews.service.FeedbackService;
import com.screening.interviews.service.MinioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.screening.interviews.service.AIFeedbackService;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@Slf4j
public class DocumentParserController {

    private final DocumentParserService documentParserService;
    private final AIFeedbackService aiFeedbackService;
    private final MinioService minioService;

    @Autowired
    public DocumentParserController(DocumentParserService documentParserService, AIFeedbackService aiFeedbackService, MinioService minioService) {
        this.documentParserService = documentParserService;
        this.aiFeedbackService = aiFeedbackService;
        this.minioService = minioService;
    }

    @PostMapping("/parse")
    public ResponseEntity<ParsedDocumentResponse> parseDocument(@RequestParam("file") MultipartFile file) {
        try {
            String content = documentParserService.parseDocument(file);
            return ResponseEntity.ok(new ParsedDocumentResponse(content));
        } catch (IOException e) {
            log.error("Error parsing document", e);
            return ResponseEntity.badRequest().body(new ParsedDocumentResponse("Error parsing document: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.error("Invalid request", e);
            return ResponseEntity.badRequest().body(new ParsedDocumentResponse(e.getMessage()));
        }
    }

    @PostMapping("/upload-and-summarize")
    public ResponseEntity<DocumentUploadResponse> uploadAndSummarize(@RequestParam("file") MultipartFile file) {
        try {
            // Step 1: Parse the document content
            String content = documentParserService.parseDocument(file);

            // Step 2: Upload the file to MinIO with 21-week presigned URL
            Map<String, String> fileData = minioService.uploadFile(file);
            String fileName = fileData.get("fileName");
            String fileUrl = fileData.get("fileUrl");
            String expiresAfter = fileData.get("expiresAfter");

            // Step 3: Generate AI summary
            String aiSummary = aiFeedbackService.generateResumeSummary(content);

            // Create response with all the data
            DocumentUploadResponse response = DocumentUploadResponse.builder()
                    .fileId(fileName)
                    .fileName(file.getOriginalFilename())
                    .fileUrl(fileUrl)
                    .expiresAfter(expiresAfter)
                    .content(content)
                    .summary(aiSummary)
                    .build();

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error processing document", e);
            return ResponseEntity.badRequest().body(
                    DocumentUploadResponse.builder()
                            .error("Error processing document: " + e.getMessage())
                            .build()
            );
        } catch (IllegalArgumentException e) {
            log.error("Invalid request", e);
            return ResponseEntity.badRequest().body(
                    DocumentUploadResponse.builder()
                            .error(e.getMessage())
                            .build()
            );
        } catch (RuntimeException e) {
            log.error("Error uploading to MinIO or generating summary", e);
            return ResponseEntity.badRequest().body(
                    DocumentUploadResponse.builder()
                            .error("Error in processing: " + e.getMessage())
                            .build()
            );
        }
    }

    @PostMapping("/summarize")
    public ResponseEntity<DocumentParseResponse> summarizeResume(@RequestBody ResumeSummaryRequest request) {
        try {
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new DocumentParseResponse(
                        request.getContent(), "No content provided for summarization"));
            }

            // Use AI to generate an improved summary
            String aiSummary = aiFeedbackService.generateResumeSummary(request.getContent());

            return ResponseEntity.ok(new DocumentParseResponse(request.getContent(), aiSummary));
        } catch (Exception e) {
            log.error("Error summarizing resume: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new DocumentParseResponse(
                    request.getContent(), "Failed to generate AI summary"));
        }
    }

    @PostMapping("/compareCandidateProfile")
    public ResponseEntity<SwotAnalysisResponseDto> compareCandidateProfile(@RequestBody CandidateComparisonRequestDto request) {
        log.info("Comparing candidate skills with job description");
        try {
            // Assumes aiFeedbackService has an analyzeCandidateMatch method that returns a CandidateComparisonResponse.
            SwotAnalysisResponseDto response = aiFeedbackService.analyzeCandidateMatch(request.getJobDescription(), request.getResume());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error comparing candidate profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/resume/{fileId}")
    public ResponseEntity<?> getResumeUrl(@PathVariable String fileId) {
        try {
            // Generate a new presigned URL for an existing file
            String presignedUrl = minioService.getFileUrl(fileId);

            return ResponseEntity.ok(Map.of(
                    "fileUrl", presignedUrl,
                    "expiresAfter", "21 weeks"
            ));
        } catch (Exception e) {
            log.error("Error generating resume URL: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to generate resume URL: " + e.getMessage()
            ));
        }
    }
}