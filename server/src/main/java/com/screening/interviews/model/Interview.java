package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.screening.interviews.enums.InterviewMode;
import com.screening.interviews.enums.InterviewStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interview_id")
    private Long interviewId;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @ManyToOne
    @JoinColumn(name = "candidate_job_id", nullable = false)
    private CandidateJob candidateJob;

    @Column(name = "candidate_email", nullable = false)
    private String candidateEmail;

    @Column(name = "test_id", nullable = true)
    private Long testId;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Column(name = "interview_date", nullable = false)
    private LocalDateTime interviewDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", length = 50, nullable = false)
    private InterviewMode mode;

    @Column(name = "meeting_link", columnDefinition = "text")
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private InterviewStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Fields for secure email access.
    @Column(name = "secure_token", columnDefinition = "text")
    private String secureToken;

    @Column(name = "token_expiration")
    private LocalDateTime tokenExpiration;

    @Column(name = "position", nullable = false)
    private String position;

    @Column(name = "email_sent")
    private Boolean emailSent;

    @Column(name = "resume_content", columnDefinition = "text")
    private String resumeContent;

    @Column(name = "resume_summary", columnDefinition = "text")
    private String resumeSummary;

    // New fields for resume file URL
    @Column(name = "resume_file_url", columnDefinition = "text")
    private String resumeFileUrl;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "resume_file_expires_after")
    private String resumeFileExpiresAfter;

    // Email content fields.
    @Column(name = "candidate_email_content", columnDefinition = "text")
    private String candidateEmailContent;

    @Column(name = "interviewer_email_content", columnDefinition = "text")
    private String interviewerEmailContent;

    // One-to-many relation to InterviewersInterview.
    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InterviewersInterview> interviewers = new ArrayList<>();

    // One-to-many relation to FeedbackTemplate
    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonManagedReference
    private List<FeedbackTemplate> feedbackTemplates = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.mode == null) {
            this.mode = InterviewMode.VIRTUAL;
        }
        if (this.status == null) {
            this.status = InterviewStatus.SCHEDULED;
        }
        if (this.emailSent == null) {
            this.emailSent = false;
        }
    }
}