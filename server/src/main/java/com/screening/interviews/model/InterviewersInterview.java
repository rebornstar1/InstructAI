package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "interviewers_interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewersInterview {

    @EmbeddedId
    private InterviewersInterviewId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("interviewId")
    @JoinColumn(name = "interview_id")
    @JsonBackReference
    private Interview interview;

    // Removed the duplicate userId column mapping to avoid conflicts.
    // Access userId from id.getUserId() when needed.

    @Column(name = "name", length = 50)
    private String name;

    @Column(name = "email", length = 100)
    private String email;

    public void setUserId(Long userId) {
        if (this.id == null) {
            this.id = new InterviewersInterviewId();
        }
        this.id.setUserId(userId);
    }

    // Convenience getter method
    public Long getUserId() {
        return (this.id != null) ? this.id.getUserId() : null;
    }
}

// Need to Make this changes at some instances Respectively
// No—this change should not affect the rest of your code as long as you update any references to the user ID. Instead of calling something like interviewersInterview.getUserId(), you would now use interviewersInterview.getId().getUserId(). If you update those references, the behavior remains the same.