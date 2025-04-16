package com.screening.interviews.service;

import com.screening.interviews.dto.CourseCompletionDto;
import com.screening.interviews.dto.StreakInfoDto;
import com.screening.interviews.dto.StreakInfoDto;
import com.screening.interviews.dto.XpUpdateDto;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StreakService streakService;

    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Transactional
    public User addXp(XpUpdateDto xpUpdateDto) {
        User user = getCurrentUser();
        user.setXp(user.getXp() + xpUpdateDto.getXpAmount());
        return userRepository.save(user);
    }

    @Transactional
    public User completeCourse(CourseCompletionDto courseCompletionDto) {
        User user = getCurrentUser();
        user.getCompletedCourses().add(courseCompletionDto.getCourseId());
        return userRepository.save(user);
    }

    @Transactional
    public User removeCourseCompletion(CourseCompletionDto courseCompletionDto) {
        User user = getCurrentUser();
        user.getCompletedCourses().remove(courseCompletionDto.getCourseId());
        return userRepository.save(user);
    }

    public User getUserProfile() {
        return getCurrentUser();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public StreakInfoDto recordActivity() {
        User user = getCurrentUser();

        StreakInfoDto streakInfo = streakService.updateUserStreak(user);

        return streakInfo;
        // Process other activity related logic...
    }

}