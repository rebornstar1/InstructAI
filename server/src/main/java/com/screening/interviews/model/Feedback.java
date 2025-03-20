package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.screening.interviews.enums.Recommendation;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    @JsonIgnore
    private Interview interview;

    @Column(name = "interviewer_id", nullable = false)
    private Long interviewerId;   // userId

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation", length = 20)
    private Recommendation recommendation;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "feedback_data", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> feedbackData;

    @PrePersist
    public void prePersist() {
        this.submittedAt = LocalDateTime.now();
        if (this.recommendation == null) {
            this.recommendation = Recommendation.PROCEED;
        }
    }
}