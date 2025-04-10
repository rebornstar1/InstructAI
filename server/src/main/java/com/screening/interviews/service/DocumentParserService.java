package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentParserService {

    private final ObjectMapper objectMapper;
    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;

    public String parseDocument(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IllegalArgumentException("File name cannot be null");
        }

        try (InputStream inputStream = file.getInputStream()) {
            if (fileName.toLowerCase().endsWith(".pdf")) {
                return parsePdf(inputStream);
            } else if (fileName.toLowerCase().endsWith(".docx")) {
                return parseDocx(inputStream);
            } else {
                throw new IllegalArgumentException("Unsupported file format. Only PDF and DOCX are supported.");
            }
        }
    }

    private String parsePdf(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String parseDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(document);
            return extractor.getText();
        }
    }

    public List<String> extractTopicsFromResume(MultipartFile resumeFile) {
        try {
            // Parse the document to extract text
            String resumeText = parseDocument(resumeFile);

            // Limit text size to prevent payload issues
            if (resumeText.length() > 10000) {
                resumeText = resumeText.substring(0, 10000);
                log.info("Resume text truncated to 10,000 characters to prevent payload size issues");
            }

            // Create a proper prompt for topic extraction
            String prompt = "Analyze the following resume and identify the top 5 technical skills, technologies, " +
                    "or knowledge areas that are most prominent. Return ONLY a JSON array of strings with these 5 topics. " +
                    "For example: [\"Java\", \"Spring Boot\", \"AWS\", \"CI/CD\", \"Microservices\"]. " +
                    "Here is the resume text:\n\n" + resumeText;

            // Build the request using the format Gemini expects
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of(
                                    "text", prompt
                            ))
                    ))
            );

            // Convert to JSON string using ObjectMapper
            String payload = objectMapper.writeValueAsString(requestBody);

            log.info("Calling Gemini API to extract topics from resume...");

            // Make the API request
            String rawResponse = geminiWebClient.post()
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (rawResponse == null) {
                return Collections.singletonList("Could not get a response from the AI service");
            }

            // Parse the response
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode()) {
                return Collections.singletonList("Unexpected response format from AI service");
            }

            String topicsText = textNode.asText().trim();

            // Clean up the response if it contains markdown code blocks
            topicsText = topicsText.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            // Try to parse as JSON array
            try {
                JsonNode topicsNode = objectMapper.readTree(topicsText);
                List<String> topics = new ArrayList<>();

                if (topicsNode.isArray()) {
                    for (JsonNode topic : topicsNode) {
                        topics.add(topic.asText());
                    }
                    return topics;
                }
            } catch (Exception e) {
                log.warn("Failed to parse JSON array: {}", e.getMessage());
            }

            // Return error message if parsing fails
            return Collections.singletonList("Failed to extract structured topics from AI response");
        } catch (Exception e) {
            log.error("Error extracting topics from resume: {}", e.getMessage(), e);
            return Collections.singletonList("Failed to extract topics: " + e.getMessage());
        }
    }
}