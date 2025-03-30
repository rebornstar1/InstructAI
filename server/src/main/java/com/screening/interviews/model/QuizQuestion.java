package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(columnDefinition = "text")
    private String question;

    // Store options as a collection of strings.
    @ElementCollection
    @CollectionTable(name = "quiz_question_options", joinColumns = @JoinColumn(name = "quiz_question_id"))
    @Column(name = "option_text", columnDefinition = "text")
    private List<String> options;

    private String correctAnswer;

    @Column(columnDefinition = "text")
    private String explanation;

    // Associate the question with a Quiz.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    @JsonBackReference
    private Quiz quiz;
}
