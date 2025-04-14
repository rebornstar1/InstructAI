package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

    @Column(unique = true)
    private String email;

    private String firstName;

    private String lastName;

    private String linkedinUrl;

    private int xp = 0;

    @ElementCollection
    @CollectionTable(name = "completed_courses", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "course_id")
    private Set<Long> completedCourses = new HashSet<>();

    @ManyToMany(mappedBy = "members")
    @OrderBy("name ASC")
    private List<Thread> threads = new ArrayList<>();

    // Streak related fields
    private int currentStreak = 0;
    private int maxStreak = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;


    public String getRole() {
        return "USER";
    }

    // These changes should be applied to your existing User.java model

    /**
     * Calculate the required XP for the next level.
     * This can be added to your existing User class.
     * @return XP required for next level
     */
    public int getNextLevelXPRequirement() {
        int currentLevel = getLevel();
        // Example formula: 100 * level^1.5
        return (int)(100 * Math.pow(currentLevel, 1.5));
    }

    /**
     * Calculate the user's current level based on XP.
     * This can be added to your existing User class.
     * @return current level
     */
    public int getLevel() {
        // Simple formula: level = 1 + (XP / 100)
        // You can use more complex formulas as needed
        return 1 + (this.xp / 100);
    }

    /**
     * Calculate progress towards next level (0-100%).
     * This can be added to your existing User class.
     * @return percentage progress towards next level
     */
    public int getLevelProgress() {
        int currentLevel = getLevel();
        int currentLevelXP = (currentLevel - 1) * 100; // Base XP for current level
        int nextLevelXP = getNextLevelXPRequirement(); // XP required for next level
        int levelXPRange = nextLevelXP - currentLevelXP;

        // Calculate progress within current level
        int levelProgress = ((this.xp - currentLevelXP) * 100) / levelXPRange;
        return Math.min(100, Math.max(0, levelProgress)); // Clamp between 0-100
    }
}