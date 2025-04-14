package com.screening.interviews.service;

import com.screening.interviews.dto.StreakInfoDto;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final UserRepository userRepository;

    @Transactional
    public StreakInfoDto updateUserStreak(User user) {
        boolean streakExtended = false;
        LocalDate today = LocalDate.now();
        LocalDate lastActivityDate = user.getLastActivityDate();

        if (lastActivityDate == null) {
            // First activity
            user.setCurrentStreak(1);
            user.setMaxStreak(1);
            streakExtended = true;
        } else if (lastActivityDate.equals(today)) {
            // Already updated today, no change needed
            return new StreakInfoDto(user.getCurrentStreak(), user.getMaxStreak(), false);
        } else if (lastActivityDate.equals(today.minusDays(1))) {
            // Consecutive day activity
            user.setCurrentStreak(user.getCurrentStreak() + 1);
            streakExtended = true;
            if (user.getCurrentStreak() > user.getMaxStreak()) {
                user.setMaxStreak(user.getCurrentStreak());
            }
        } else {
            // Streak broken
            user.setCurrentStreak(1);
            streakExtended = false;
        }

        user.setLastActivityDate(today);
        userRepository.save(user);

        return new StreakInfoDto(user.getCurrentStreak(), user.getMaxStreak(), streakExtended);
    }

    // Run daily to reset streaks for inactive users
    @Scheduled(cron = "0 0 0 * * *") // Midnight every day
    @Transactional
    public void resetInactiveStreaks() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        userRepository.findByLastActivityDateBefore(yesterday).forEach(user -> {
            user.setCurrentStreak(0);
            userRepository.save(user);
        });
    }
}