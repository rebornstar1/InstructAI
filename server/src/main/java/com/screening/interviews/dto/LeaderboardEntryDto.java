package com.screening.interviews.dto;

import com.screening.interviews.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private Integer xp;
    private Integer currentStreak;
    private Integer maxStreak;

    public static LeaderboardEntryDto fromUser(User user) {
        return LeaderboardEntryDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .xp(user.getXp())
                .currentStreak(user.getCurrentStreak())
                .maxStreak(user.getMaxStreak())
                .build();
    }
}