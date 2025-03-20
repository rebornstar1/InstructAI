package com.screening.interviews.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewersInterviewId implements Serializable {

    private Long interviewId;
    private Long userId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InterviewersInterviewId)) return false;
        InterviewersInterviewId that = (InterviewersInterviewId) o;
        return Objects.equals(interviewId, that.interviewId)
                && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(interviewId, userId);
    }
}
