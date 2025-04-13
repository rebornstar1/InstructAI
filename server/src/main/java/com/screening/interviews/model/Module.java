package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "module_id", nullable = false)
    private String moduleId; // e.g., M1, M2, etc.

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    private String duration;

    @Column(columnDefinition = "text")
    private String content;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubModule> subModules = new ArrayList<>();

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizzes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "module_learning_objectives", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "objective", columnDefinition = "text")
    private List<String> learningObjectives = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "module_video_urls", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "video_url", columnDefinition = "text")
    private List<String> videoUrls = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "module_prerequisite_modules", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "prerequisite_module_id")
    private List<Long> prerequisiteModules = new ArrayList<>();

    private String complexityLevel;

    // Key terms support
    @ElementCollection
    @CollectionTable(name = "module_key_terms", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "key_term", columnDefinition = "text")
    private List<String> keyTerms = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "module_definitions", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "definition", columnDefinition = "text")
    private List<String> definitions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @JsonBackReference
    private Course course;

    // Helper methods
    public void addSubModule(SubModule subModule) {
        subModules.add(subModule);
        subModule.setModule(this);
    }

    public void removeSubModule(SubModule subModule) {
        subModules.remove(subModule);
        subModule.setModule(null);
    }

    public void addQuiz(Quiz quiz) {
        quizzes.add(quiz);
        quiz.setModule(this);
    }

    public void removeQuiz(Quiz quiz) {
        quizzes.remove(quiz);
        quiz.setModule(null);
    }
}