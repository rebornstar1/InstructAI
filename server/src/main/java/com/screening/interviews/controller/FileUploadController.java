package com.screening.interviews.controller;

import com.screening.interviews.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final MinioService minioService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }

        String contentType = file.getContentType();
        if (!Objects.equals(contentType, "text/plain") &&
                !Objects.equals(contentType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
                !Objects.equals(contentType, "application/pdf")) {
            return ResponseEntity.badRequest().body("Only .txt, .docx, and .pdf files are allowed.");
        }

        try {
            Map<String, String> uploadResult = minioService.uploadFile(file);
            return ResponseEntity.ok(uploadResult);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/url/{fileName}")
    public ResponseEntity<?> getFileUrl(@PathVariable String fileName) {
        try {
            String fileUrl = minioService.getFileUrl(fileName);
            return ResponseEntity.ok(Map.of(
                    "fileUrl", fileUrl,
                    "expiresAfter", "21 weeks"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}