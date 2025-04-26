package com.screening.interviews.prompts;

public class ModuleContentPrompts {

    public static String createTermQuiPrompt(String safeTerm,String safeDefinition, String safeContext) {
        return String.format("""
                You are an educational quiz creator specializing in precise JSON responses.
                
                Create a quiz about '%s' with 5 multiple-choice questions based on this definition: '%s'
                
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
                
                The questions should test understanding of different aspects of %s in the context of %s.
                """, safeTerm, safeDefinition, safeTerm, safeContext);
    }

    public static String analyzeTopicAndExtractKeyTermsPrompt(String conceptTitle,String moduleTitle) {
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

    public static String createTermSubModulePrompt(String term,String context,String definition) {
        return String.format(
                "Create a focused educational article about '%s' in the context of %s. " +
                        "The article should be approximately 400-500 words (5-7 minutes reading time). " +
                        "Begin with this definition as your starting point: '%s' " +
                        "Then structure the article as follows: " +
                        "1. Start with 2-3 specific learning objectives in bullet points " +
                        "2. Expand on the definition with more detail and context " +
                        "3. Explain why this term/concept is important in understanding %s " +
                        "4. Provide at least two clear, concrete examples of this term/concept in action " +
                        "5. Describe how this term/concept relates to other key ideas in %s " +
                        "6. Include a 'Visual Representation' section describing how this concept could be visualized " +
                        "7. Add 2-3 practice exercises or reflection questions related to this term " +
                        "8. Conclude with a 'Key Takeaways' section summarizing the most important points " +
                        "Use clear, accessible language appropriate for beginners and intermediate learners. " +
                        "Format with proper markdown using headings (##, ###), bullet points, emphasis (*italic*), " +
                        "strong emphasis (**bold**), code blocks where appropriate, and blockquotes for important notes.",
                term, context, definition, context, context
        );
    }
}
