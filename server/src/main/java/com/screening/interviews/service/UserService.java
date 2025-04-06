package com.screening.interviews.service;

import com.screening.interviews.dto.CourseCompletionDto;
import com.screening.interviews.dto.XpUpdateDto;
import com.screening.interviews.model.User;
import com.screening.interviews.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
}