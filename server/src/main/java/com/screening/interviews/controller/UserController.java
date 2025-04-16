package com.screening.interviews.controller;

import com.screening.interviews.dto.CourseCompletionDto;
import com.screening.interviews.dto.StreakInfoDto;
import com.screening.interviews.dto.XpUpdateDto;
import com.screening.interviews.model.User;
import com.screening.interviews.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<User> getUserProfile() {
        return ResponseEntity.ok(userService.getUserProfile());
    }

    @PostMapping("/xp")
    public ResponseEntity<User> addXp(@RequestBody XpUpdateDto xpUpdateDto) {
        return ResponseEntity.ok(userService.addXp(xpUpdateDto));
    }

    @PostMapping("/courses/complete")
    public ResponseEntity<User> completeCourse(@RequestBody CourseCompletionDto courseCompletionDto) {
        return ResponseEntity.ok(userService.completeCourse(courseCompletionDto));
    }

    @DeleteMapping("/courses/complete")
    public ResponseEntity<User> removeCourseCompletion(@RequestBody CourseCompletionDto courseCompletionDto) {
        return ResponseEntity.ok(userService.removeCourseCompletion(courseCompletionDto));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }


    @PostMapping("/record")
    public ResponseEntity<StreakInfoDto> recordActivity() {
        StreakInfoDto streakInfo = userService.recordActivity();
        return ResponseEntity.ok(streakInfo);
    }
}