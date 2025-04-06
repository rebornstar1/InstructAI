package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    private String password;

    private int xp = 0;

    @ElementCollection
    @CollectionTable(name = "completed_courses", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "course_id")
    private Set<Long> completedCourses = new HashSet<>();

    public String getRole() {
        return "USER";
    }
}