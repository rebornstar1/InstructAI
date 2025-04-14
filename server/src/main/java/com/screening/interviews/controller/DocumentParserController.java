package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.service.DocumentParserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/documents")
@Slf4j
public class DocumentParserController {

    private final DocumentParserService documentParserService;

    @Autowired
    public DocumentParserController(DocumentParserService documentParserService) {
        this.documentParserService = documentParserService;
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

    @PostMapping("/extract-topics")
    public ResponseEntity<?> extractTopicsFromResume(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }

        String contentType = file.getContentType();
        if (!Objects.equals(contentType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
                !Objects.equals(contentType, "application/pdf")) {
            return ResponseEntity.badRequest().body("Only .docx and .pdf files are allowed.");
        }

        try {
            List<String> topics = documentParserService.extractTopicsFromResume(file);
            Map<String, Object> response = new HashMap<>();
            response.put("topics", topics);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}