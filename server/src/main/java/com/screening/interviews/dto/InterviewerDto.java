package com.screening.interviews.dto;

import jakarta.validation.constraints.Email;
import lombok.*;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InterviewerDto {
    public String name;
    public String email;
    public Long userId;
}
