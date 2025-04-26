package com.screening.interviews.prompts;

/**
 * Contains all prompt templates for generating learning resources.
 * Separates prompt management from service logic for better maintainability.
 */
public class LearningResourcePrompts {

    /**
     * Generates a prompt for creating main content about a concept.
     *
     * @param conceptTitle The title of the concept
     * @param moduleTitle The title of the module containing the concept
     * @return A formatted prompt string
     */
    public static String mainContentPrompt(String conceptTitle, String moduleTitle) {
        return String.format(
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
    }

    /**
     * Generates a prompt for creating a video transcript about a concept.
     *
     * @param conceptTitle The title of the concept
     * @return A formatted prompt string
     */
    public static String transcriptPrompt(String conceptTitle) {
        return String.format(
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
    }

    /**
     * Generates a prompt for analyzing topic complexity and extracting key terms.
     *
     * @param conceptTitle The title of the concept
     * @param moduleTitle The title of the module containing the concept
     * @return A formatted prompt string
     */
    public static String topicAnalysisPrompt(String conceptTitle, String moduleTitle) {
        return String.format(
                "Analyze the topic '%s' in the context of module '%s' and identify 5-7 key terms or concepts " +
                        "that would benefit from detailed explanation. " +
                        "IMPORTANT: Focus on WELL-KNOWN, FUNDAMENTAL concepts that most beginners would need to understand. " +
                        "Avoid highly specialized or advanced technical terms. " +
                        "Each key term MUST be specific to the domain and maintain full context. " +
                        "For example, if the topic is 'Web Development', use 'Web Hooks' instead of just 'Hooks', " +
                        "or 'JavaScript Closures' instead of just 'Closures'. " +
                        "For each term, provide a short 1-2 sentence definition that is accessible to beginners. " +
                        "Format your response as a JSON object with the term as key and definition as value: " +
                        "{ " +
                        "  \"Domain-Specific Term 1\": \"definition1\", " +
                        "  \"Domain-Specific Term 2\": \"definition2\" " +
                        "} " +
                        "Focus on identifying terms that are: " +
                        "1. Core foundational concepts that everyone in this field should know " +
                        "2. Commonly referenced in introductory materials " +
                        "3. Broadly applicable rather than niche or specialized " +
                        "4. Important for building a solid understanding of the topic " +
                        "5. Frequently used in everyday discussions about this subject " +
                        "Remember: Every term MUST include the proper domain-specific context (e.g., '%s Hooks' not just 'Hooks') " +
                        "and should be recognizable to most people with basic knowledge of the field.",
                conceptTitle, moduleTitle, conceptTitle
        );
    }

    /**
     * Generates a prompt for creating an introductory submodule.
     *
     * @param conceptTitle The title of the concept
     * @return A formatted prompt string
     */
    public static String introductionSubmodulePrompt(String conceptTitle) {
        return String.format(
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
    }

    /**
     * Generates a prompt for creating a term-specific submodule.
     *
     * @param term The specific term or concept
     * @param definition The definition of the term
     * @param conceptTitle The title of the parent concept
     * @return A formatted prompt string
     */
    public static String termSubmodulePrompt(String term, String definition, String conceptTitle) {
        return String.format(
                "Create a focused educational article about '%s' in the context of %s. " +
                        "The article should be approximately 300-400 words or 3-4 minutes reading time. " +
                        "Begin with this definition as your starting point: '%s' " +
                        "Then structure the article as follows: " +
                        "1. Expand on the definition with more detail and context " +
                        "2. Explain why this term/concept is important in understanding %s " +
                        "3. Provide at least one clear, concrete example of this term/concept in action " +
                        "4. Describe how this term/concept relates to other key ideas in %s " +
                        "5. Include a simple diagram or visual description that would help illustrate this concept " +
                        "6. Add 1-2 practice exercises or reflection questions related to this term " +
                        "Use clear, accessible language and markdown formatting with appropriate headings, " +
                        "emphasis, and code blocks if relevant.",
                term, conceptTitle, definition, conceptTitle, conceptTitle
        );
    }

    /**
     * Generates a prompt for creating an advanced application submodule.
     *
     * @param conceptTitle The title of the concept
     * @param termsList A comma-separated list of relevant terms
     * @return A formatted prompt string
     */
    public static String advancedApplicationSubmodulePrompt(String conceptTitle, String termsList) {
        return String.format(
                "Create an advanced application article about '%s' that integrates these key terms: %s. " +
                        "The article should be approximately 500-600 words or 6 minutes reading time. " +
                        "Structure the article following these educational best practices: " +
                        "1. Begin with 3-4 advanced learning objectives that build on foundational knowledge " +
                        "2. Present a complex, real-world scenario where %s is applied " +
                        "3. Walk through a step-by-step solution that demonstrates how to apply multiple concepts together " +
                        "4. Highlight how the key terms/concepts interact with each other in this scenario " +
                        "5. Discuss common pitfalls or challenges in advanced applications " +
                        "6. Provide troubleshooting tips or best practices " +
                        "7. Include a section on emerging trends or future developments " +
                        "8. Add 2-3 advanced practice exercises that require integrating multiple concepts " +
                        "Use appropriate technical language with explanations where needed. " +
                        "Format with markdown using proper headings, code blocks for technical examples, " +
                        "and emphasized text for important points.",
                conceptTitle, termsList, conceptTitle
        );
    }

    /**
     * Generates a prompt for creating a basic concepts quiz.
     *
     * @param conceptTitle The title of the concept
     * @return A formatted prompt string
     */
    public static String basicQuizPrompt(String conceptTitle) {
        return String.format(
                "Create a quiz to test basic understanding of '%s' with 5 multiple-choice questions. " +
                        "For each question: " +
                        "1. Write a clear question focused on fundamental concepts " +
                        "2. Provide 4 answer options (A, B, C, D) " +
                        "3. Indicate the correct answer " +
                        "4. Include a brief explanation for why the answer is correct " +
                        "5. Ensure questions progress from simple recall to basic application " +
                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"What is...?\", " +
                        "      \"options\": [\"A. option 1\", \"B. option 2\", \"C. option 3\", \"D. option 4\"], " +
                        "      \"correctAnswer\": \"B\", " +
                        "      \"explanation\": \"Explanation why B is correct...\" " +
                        "    } " +
                        "  ] " +
                        "} " +
                        "Focus on essential terminology and foundational principles that every beginner should master.",
                conceptTitle
        );
    }

    /**
     * Generates a prompt for creating an advanced concepts quiz.
     *
     * @param conceptTitle The title of the concept
     * @return A formatted prompt string
     */
    public static String advancedQuizPrompt(String conceptTitle) {
        return String.format(
                "Create a quiz to test advanced understanding of '%s' with 5 challenging multiple-choice questions. " +
                        "For each question: " +
                        "1. Write a question that tests deeper understanding or application of complex concepts " +
                        "2. Provide 4 answer options (A, B, C, D) with plausible distractors " +
                        "3. Indicate the correct answer " +
                        "4. Include a detailed explanation that clarifies misconceptions " +
                        "5. Ensure questions require analysis, evaluation, or synthesis of knowledge " +
                        "Format as a structured JSON object with these exact fields: " +
                        "{ " +
                        "  \"questions\": [ " +
                        "    { " +
                        "      \"question\": \"In a complex scenario where...?\", " +
                        "      \"options\": [\"A. option 1\", \"B. option 2\", \"C. option 3\", \"D. option 4\"], " +
                        "      \"correctAnswer\": \"C\", " +
                        "      \"explanation\": \"C is correct because...\" " +
                        "    } " +
                        "  ] " +
                        "} " +
                        "Focus on nuanced understanding, common misconceptions, and practical applications of advanced principles.",
                conceptTitle
        );
    }

    /**
     * Generates a standardized prompt for creating a quiz on any term.
     *
     * @param term The term or concept for the quiz
     * @return A formatted prompt string
     */
    public static String standardQuizPrompt(String term) {
        return String.format(
                """
                You are an educational quiz creator specializing in precise JSON responses.
                
                Create a quiz about '%s' with 5 multiple-choice questions.
                
                Format your response EXACTLY as follows:
                {
                  "questions": [
                    {
                      "question": "Question text here?",
                      "options": [
                        "A. First option",
                        "B. Second option",
                        "C. Third option",
                        "D. Fourth option"
                      ],
                      "correctAnswer": "A",
                      "explanation": "Explanation for correct answer"
                    },
                    // more questions here...
                  ]
                }
                
                CRITICAL FORMATTING RULES:
                1. Use double quotes for all JSON keys and string values
                2. Ensure proper JSON syntax with correct commas between items
                3. DO NOT include any markdown formatting (```json, etc.)
                4. DO NOT include any explanatory text before or after the JSON
                5. Ensure each question follows the EXACT format shown above
                6. Do not use line breaks within string values
                
                The questions should test understanding of different aspects of %s.
                """,
                term, term
        );
    }

    /**
     * Provides a fallback JSON structure for quizzes when generation fails.
     *
     * @return A JSON string with default quiz questions
     */
    public static String fallbackQuizJson() {
        return """
    {
      "questions": [
        {
          "question": "What is the best way to understand this concept?",
          "options": [
            "A. Study core principles",
            "B. Apply in practical scenarios",
            "C. Memorize definitions",
            "D. Compare with similar concepts"
          ],
          "correctAnswer": "B",
          "explanation": "Practical application helps reinforce understanding."
        },
        {
          "question": "Which statement best defines this term?",
          "options": [
            "A. A fundamental building block",
            "B. An advanced technique",
            "C. A specialized application",
            "D. A theoretical framework"
          ],
          "correctAnswer": "A",
          "explanation": "This term represents a core concept in the field."
        },
        {
          "question": "What is the primary purpose of this concept?",
          "options": [
            "A. To simplify complex processes",
            "B. To enable additional functionality",
            "C. To standardize approaches",
            "D. To optimize performance"
          ],
          "correctAnswer": "C",
          "explanation": "Standardization is the main benefit."
        },
        {
          "question": "How would you implement this in a real-world scenario?",
          "options": [
            "A. Through careful planning",
            "B. With specialized tools",
            "C. Following established patterns",
            "D. Using an incremental approach"
          ],
          "correctAnswer": "C",
          "explanation": "Following patterns ensures reliable implementation."
        },
        {
          "question": "What is a common misconception about this concept?",
          "options": [
            "A. It's only for advanced users",
            "B. It's difficult to implement",
            "C. It's not widely applicable",
            "D. It requires specialized knowledge"
          ],
          "correctAnswer": "D",
          "explanation": "While helpful, specialized knowledge is not required."
        }
      ]
    }
    """;
    }
}