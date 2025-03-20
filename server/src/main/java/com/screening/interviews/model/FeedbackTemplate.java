package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "feedback_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stores the text content of the feedback question/template.
    @Column(name = "template", columnDefinition = "text", nullable = false)
    private String template;

    // Many feedback templates belong to one interview.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    @JsonBackReference
    private Interview interview;
}
