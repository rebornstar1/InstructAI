package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // Business key for the quiz
    @Column(name = "quiz_uuid", nullable = false, updatable = false, unique = true)
    private String quizUuid;

    private String quizTitle;

    @Column(columnDefinition = "text")
    private String description;

    private String difficulty;
    private String timeLimit;
    private int passingScore;

    // Each Quiz is associated with one Module.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonBackReference
    private Module module;

    // A Quiz can have many questions.
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<QuizQuestion> questions;

    @PrePersist
    public void prePersist() {
        if (quizUuid == null) {
            this.quizUuid = UUID.randomUUID().toString();
        }
    }
}
