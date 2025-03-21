package com.screening.interviews.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.dto.LearningResourceRequestDto;
import com.screening.interviews.dto.LearningResourceDto;
import com.screening.interviews.dto.SubModuleDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private static final Logger logger = LoggerFactory.getLogger(LearningResourceService.class);

    private final @Qualifier("geminiWebClient") WebClient geminiWebClient;
    private final ObjectMapper objectMapper;

    /**
     * Generates a comprehensive learning resource based on the user's request by sending enhanced
     * educational prompts to Gemini.
     *
     * @param request LearningResourceRequestDto containing conceptTitle, moduleTitle, etc.
     * @return a LearningResourceDto with main content, submodules, and transcript
     */
    public LearningResourceDto generateLearningResource(LearningResourceRequestDto request) {
        String conceptTitle = request.getConceptTitle() != null ? request.getConceptTitle() : request.getModuleTitle();
        String moduleTitle = request.getModuleTitle();

        logger.info("Starting learning resource generation for concept: {}, module: {}", conceptTitle, moduleTitle);

        // Generate main content with Gemini using an enhanced educational prompt
        String mainContentPrompt = String.format(
                "Create a comprehensive learning resource about '%s' in markdown format for module '%s'. " +
                        "The content should be approximately 400-500 words or about 5-7 minutes of reading time. " +

                        "Follow this educational structure: " +
                        "1. Start with clear learning objectives that state exactly what the reader will learn " +
                        "2. Write an engaging introduction that provides context and explains why this topic matters " +
                        "3. Include conceptual definitions for all key terms to build a solid foundation " +
                        "4. Break down complex ideas with detailed step-by-step explanations " +
                        "5. Illustrate with at least 2 real-world examples or case studies " +
                        "6. Describe visual aids that would enhance understanding (in markdown, describe what the image would show) " +
                        "7. Add 2-3 reflective questions that encourage readers to apply the concepts " +
                        "8. End with a concise summary that reinforces key points " +
                        "9. Include a mini-glossary of 3-5 essential terms " +

                        "Use proper markdown formatting with headings (##, ###), bullet points, numbered lists, *emphasis*, " +
                        "**strong emphasis**, `code blocks` when applicable, and > blockquotes for important points.",
                conceptTitle, moduleTitle
        );

        if (logger.isDebugEnabled()) {
            logger.debug("Main content prompt (truncated if long): {}",
                    mainContentPrompt.length() > 500 ? mainContentPrompt.substring(0, 500) + "... [truncated]" : mainContentPrompt);
        }

        String mainContent = callGeminiApi(mainContentPrompt);

        // Generate transcript for video content
        logger.info("Generating video transcript for concept: {}", conceptTitle);
        String transcriptPrompt = String.format(
                "Create a transcript for a 3-5 minute educational video about '%s'. " +

                        "The transcript should follow this educational narrative structure: " +
                        "1. Start with an attention-grabbing hook or question (10-15 seconds) " +
                        "2. Introduce yourself and the learning objectives (20-30 seconds) " +
                        "3. Provide a brief overview using a relatable analogy (30 seconds) " +
                        "4. Explain core concepts clearly with pauses for emphasis (1-2 minutes) " +
                        "5. Walk through a visual example, describing what viewers would see (1 minute) " +
                        "6. Address a common misconception or challenge (30 seconds) " +
                        "7. Summarize key points with clear takeaways (30 seconds) " +
                        "8. End with a call to action and preview of related topics (15-20 seconds) " +

                        "Use a conversational, engaging tone suitable for narration. Include natural transitions " +
                        "between sections and occasional rhetorical questions to maintain engagement. " +
                        "Format the transcript with speaker cues and [Action] descriptions for visual elements.",
                conceptTitle
        );

        String transcript = callGeminiApi(transcriptPrompt);

        // Generate submodules with appropriate article length
        List<SubModuleDto> subModules = generateSubModules(conceptTitle, moduleTitle);

        LearningResourceDto result = LearningResourceDto.builder()
                .conceptTitle(conceptTitle)
                .moduleTitle(moduleTitle)
                .content(mainContent)
                .transcript(transcript)
                .videoUrl("http://example.com/videos/" + conceptTitle.replaceAll("\\s+", "-").toLowerCase())
                .subModules(subModules)
                .build();

        logger.info("Successfully generated learning resource for concept: {}", conceptTitle);
        return result;
    }

    /**
     * Generates submodules for the learning resource with introduction, advanced, and practical implementation sections.
     *
     * @param conceptTitle The concept or topic title
     * @param moduleTitle The module title
     * @return List of SubModuleDto objects
     */
    private List<SubModuleDto> generateSubModules(String conceptTitle, String moduleTitle) {
        List<SubModuleDto> subModules = new ArrayList<>();

        logger.info("Generating introduction submodule for concept: {}", conceptTitle);
        // Introduction submodule with enhanced educational structure
        String introPrompt = String.format(
                "Create an introductory article about '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the article following these educational best practices: " +
                        "1. Begin with 3-4 specific learning objectives in a bulleted list (what readers will learn) " +
                        "2. Write an engaging introduction that hooks the reader with a relevant analogy or question " +
                        "3. Define all fundamental concepts in a clear, accessible way " +
                        "4. Use a step-by-step approach for explaining basics with numbered lists " +
                        "5. Include 1-2 beginner-friendly examples that illustrate the concepts " +
                        "6. Suggest a simple visualization that would help beginners understand (describe what an image would show) " +
                        "7. Add 2 reflection questions that check basic understanding " +
                        "8. Include a 'Key Takeaways' section that summarizes essential points " +
                        "9. Close with a brief preview of more advanced topics " +

                        "Ensure all explanations are beginner-friendly and avoid jargon without explanation. " +
                        "Use markdown formatting effectively with ## headings, ### subheadings, **bold** for important terms, " +
                        "and `code examples` if relevant.",
                conceptTitle
        );

        String introArticle = callGeminiApi(introPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Introduction to " + conceptTitle)
                .article(introArticle)
                .tags(Arrays.asList("introduction", "basics", "fundamentals"))
                .keywords(Arrays.asList("concept", "introduction", "basics", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        logger.info("Generating advanced submodule for concept: {}", conceptTitle);
        // Advanced submodule with enhanced educational structure
        String advancedPrompt = String.format(
                "Create an advanced article about '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the article following these educational best practices: " +
                        "1. Start with 3-4 advanced learning objectives that build on foundational knowledge " +
                        "2. Begin with a brief recap connecting basic concepts to advanced applications " +
                        "3. Explain complex concepts with precise definitions and terminology " +
                        "4. Present at least one detailed case study or complex real-world example " +
                        "5. Discuss common challenges, pitfalls, or misconceptions at this advanced level " +
                        "6. Describe a comparative diagram or visualization that would illustrate advanced concepts " +
                        "7. Include a troubleshooting section that addresses common advanced problems " +
                        "8. Add 2-3 challenging reflection questions that require applying advanced concepts " +
                        "9. Conclude with emerging trends or future directions in this field " +
                        "10. Include a small reference section with theoretical resources for deeper exploration " +

                        "Use appropriate technical language but explain specialized terms. " +
                        "Format with markdown using ## for main sections, ### for subsections, **bold** for key concepts, " +
                        "`code blocks` for technical examples, and > blockquotes for expert insights.",
                conceptTitle
        );

        String advancedArticle = callGeminiApi(advancedPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Advanced " + conceptTitle)
                .article(advancedArticle)
                .tags(Arrays.asList("advanced", "in-depth", "applications"))
                .keywords(Arrays.asList("advanced", "detailed", "expert", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        logger.info("Generating practical implementation submodule for concept: {}", conceptTitle);
        // Practical implementation submodule with enhanced educational structure
        String practicalPrompt = String.format(
                "Create a practical implementation guide for '%s' in markdown format. " +
                        "The article should be approximately 400-500 words or 5 minutes reading time. " +

                        "Structure the guide following these educational best practices: " +
                        "1. Begin with 3-4 practical skill-based learning objectives " +
                        "2. List any prerequisites or required background knowledge " +
                        "3. Provide an overview of the implementation process with a numbered workflow " +
                        "4. Break down the implementation into clear, sequential steps " +
                        "5. Include practical code samples, commands, or specific instructions where relevant " +
                        "6. Highlight common errors or pitfalls and how to avoid them " +
                        "7. Suggest a workflow diagram that would illustrate the implementation process " +
                        "8. Provide debugging tips or troubleshooting guidance " +
                        "9. Add 2-3 hands-on exercises or challenges for practice " +
                        "10. Include a checklist for verifying successful implementation " +
                        "11. End with next steps for extending or customizing the implementation " +

                        "Use clear, action-oriented language with specific examples. " +
                        "Format with markdown using ## for main sections, ### for steps, **bold** for important warnings, " +
                        "```code blocks``` for implementation examples, and * bullet points for tips and alternatives.",
                conceptTitle
        );

        String practicalArticle = callGeminiApi(practicalPrompt);

        subModules.add(SubModuleDto.builder()
                .subModuleTitle("Practical Implementation of " + conceptTitle)
                .article(practicalArticle)
                .tags(Arrays.asList("practical", "implementation", "hands-on"))
                .keywords(Arrays.asList("implementation", "practice", "tutorial", conceptTitle.toLowerCase()))
                .readingTime("5 minutes")
                .build());

        return subModules;
    }

    /**
     * Calls the Gemini API with the given prompt and extracts the generated text from the response.
     *
     * @param prompt The detailed prompt for content generation
     * @return The text content generated by Gemini
     */
    private String callGeminiApi(String prompt) {
        // Construct the payload for Gemini API
        String payload = String.format("""
            {
                "contents": [{
                    "parts": [{
                        "text": "%s"
                    }]
                }]
            }
            """, prompt.replace("\"", "\\\""));

        try {
            // Call Gemini API
            String rawResponse = geminiWebClient.post()
                    .uri("") // URL is already set in the WebClient bean
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (logger.isTraceEnabled()) {
                logger.trace("Raw response from Gemini API: {}", rawResponse);
            }

            // Parse the response to extract the content
            JsonNode root = objectMapper.readTree(rawResponse);
            // Typically, the structure is "candidates" -> [0] -> "content" -> "parts" -> [0] -> "text"
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            String generatedText = textNode.asText();

            if (generatedText == null || generatedText.trim().isEmpty()) {
                logger.warn("Gemini API returned empty text content");
                return "Content generation failed. Please try again.";
            }

            // Clean up triple backticks if the LLM included them
            generatedText = generatedText.replaceAll("```markdown", "")
                    .replaceAll("```", "")
                    .trim();

            return generatedText;

        } catch (Exception e) {
            logger.error("Error calling Gemini API or parsing response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate content from Gemini API", e);
        }
    }
}