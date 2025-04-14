package com.screening.interviews.controller;

import com.screening.interviews.dto.LeaderboardEntryDto;
import com.screening.interviews.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/streaks")
    public ResponseEntity<List<LeaderboardEntryDto>> getStreakLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(leaderboardService.getStreakLeaderboard(limit));
    }

    @GetMapping("/max-streaks")
    public ResponseEntity<List<LeaderboardEntryDto>> getMaxStreakLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(leaderboardService.getMaxStreakLeaderboard(limit));
    }

    @GetMapping("/xp")
    public ResponseEntity<List<LeaderboardEntryDto>> getXpLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(leaderboardService.getXpLeaderboard(limit));
    }
}