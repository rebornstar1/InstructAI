package com.screening.interviews.service;

import com.screening.interviews.dto.LeaderboardEntryDto;
import com.screening.interviews.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;

    public List<LeaderboardEntryDto> getStreakLeaderboard(int limit) {
        return userRepository.findAll().stream()
                .map(LeaderboardEntryDto::fromUser)
                .sorted(Comparator.comparing(LeaderboardEntryDto::getCurrentStreak).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDto> getXpLeaderboard(int limit) {
        return userRepository.findAll().stream()
                .map(LeaderboardEntryDto::fromUser)
                .sorted(Comparator.comparing(LeaderboardEntryDto::getXp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDto> getMaxStreakLeaderboard(int limit) {
        return userRepository.findAll().stream()
                .map(LeaderboardEntryDto::fromUser)
                .sorted(Comparator.comparing(LeaderboardEntryDto::getMaxStreak).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }
}