package com.screening.interviews.fallback;

public class ModuleContentFallback {
    public static String FallBackQuizJson() {
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
