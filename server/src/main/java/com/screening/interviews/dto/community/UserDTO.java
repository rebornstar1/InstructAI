package com.screening.interviews.dto.community;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private LocalDateTime createdAt;
    private boolean active;

    // Constructors
    public UserDTO() {
    }
}