package com.screening.interviews.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddInterviewerDto {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Name is required")
    private String name;

    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}