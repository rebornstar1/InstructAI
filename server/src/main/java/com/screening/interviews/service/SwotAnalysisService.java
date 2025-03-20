package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.screening.interviews.dto.SwotAnalysisRequestDto;
import com.screening.interviews.dto.SwotAnalysisResponseDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class SwotAnalysisService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private String geminiApiKey = "AIzaSyCcTsDBMal4lRkGCjxy6dIwFcaWGRG4ntU"; // Using the same key as AIFeedbackService

    public SwotAnalysisResponseDto generateSwotAnalysis(SwotAnalysisRequestDto request) {
        try {
            log.info("Generating SWOT analysis for candidate: {}", request.getCandidateName());

            // Build the Gemini API request
            String apiRequest = buildGeminiRequestSwot(request);

            // Call the Gemini API
            String response = webClient.post()
                    .uri("/v1beta/models/gemini-1.5-flash:generateContent")
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", geminiApiKey)
                    .bodyValue(apiRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Gemini API response received for SWOT analysis");

            // Parse the response
            return parseSwotResponse(response);

        } catch (Exception e) {
            log.error("Error generating SWOT analysis: {}", e.getMessage(), e);
            // Return fallback response
            return createFallbackSwotResponse();
        }
    }

    private String buildGeminiRequestSwot(SwotAnalysisRequestDto request) {
        String escapedResumeContent = request.getResumeContent().replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");

        String candidateName = request.getCandidateName() != null ? request.getCandidateName() : "the candidate";
        String position = request.getPosition() != null ? request.getPosition() : "the applied position";

        return String.format("""
            {
                "contents": [{
                    "parts": [{
                        "text": "Based on the following resume content, provide a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for %s who is applying for %s position. Return ONLY a valid JSON object with these exact keys: 'strengths' (array of strings), 'weaknesses' (array of strings), 'opportunities' (array of strings), 'threats' (array of strings), and 'summary' (string). Be objective, constructive, and relevant to the position. Resume content: %s"
                    }]
                }]
            }
            """, candidateName, position, escapedResumeContent);
    }

    private SwotAnalysisResponseDto parseSwotResponse(String response) {
        try {
            // Parse the response
            JsonNode root = objectMapper.readTree(response);
            String jsonContent = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();

            // Clean the content
            jsonContent = cleanJsonContent(jsonContent);

            // Try to parse the content as JSON
            JsonNode parsedContent = objectMapper.readTree(jsonContent);

            // Extract SWOT components
            List<String> strengths = new ArrayList<>();
            List<String> weaknesses = new ArrayList<>();
            List<String> opportunities = new ArrayList<>();
            List<String> threats = new ArrayList<>();
            String summary = "";

            if (parsedContent.has("strengths") && parsedContent.get("strengths").isArray()) {
                parsedContent.get("strengths").forEach(item -> strengths.add(item.asText()));
            }

            if (parsedContent.has("weaknesses") && parsedContent.get("weaknesses").isArray()) {
                parsedContent.get("weaknesses").forEach(item -> weaknesses.add(item.asText()));
            }

            if (parsedContent.has("opportunities") && parsedContent.get("opportunities").isArray()) {
                parsedContent.get("opportunities").forEach(item -> opportunities.add(item.asText()));
            }

            if (parsedContent.has("threats") && parsedContent.get("threats").isArray()) {
                parsedContent.get("threats").forEach(item -> threats.add(item.asText()));
            }

            if (parsedContent.has("summary")) {
                summary = parsedContent.get("summary").asText();
            }

            return SwotAnalysisResponseDto.builder()
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .opportunities(opportunities)
                    .threats(threats)
                    .summary(summary)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing SWOT analysis response: {}", e.getMessage(), e);
            return createFallbackSwotResponse();
        }
    }

    private String cleanJsonContent(String content) {
        if (content == null) return "{}";

        // Remove code blocks, backticks, and invalid characters
        content = content.replaceAll("```json", "")
                .replaceAll("```", "")
                .replaceAll("`", "")
                .trim();

        // Remove any comments
        content = content.replaceAll("//.*\\n", "")
                .replaceAll("/\\*.*?\\*/", "")
                .trim();

        // If content starts with a newline or spaces, trim them
        while (content.startsWith("\\n") || content.startsWith("\n")) {
            content = content.substring(2).trim();
        }

        return content;
    }

    private SwotAnalysisResponseDto createFallbackSwotResponse() {
        return SwotAnalysisResponseDto.builder()
                .strengths(Arrays.asList("Could not analyze strengths from resume"))
                .weaknesses(Arrays.asList("Could not analyze weaknesses from resume"))
                .opportunities(Arrays.asList("Could not analyze opportunities from resume"))
                .threats(Arrays.asList("Could not analyze threats from resume"))
                .summary("Failed to generate SWOT analysis. Please try again or contact support if the issue persists.")
                .build();
    }
}