package com.screening.interviews.controller;

import com.screening.interviews.dto.community.ThreadDTO;
import com.screening.interviews.dto.community.UserDTO;
import com.screening.interviews.service.ThreadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/threads")
public class ThreadController {

    @Autowired
    private ThreadService threadService;

    // Get all main threads
    @GetMapping("/main")
    public ResponseEntity<List<ThreadDTO>> getAllMainThreads() {
        return ResponseEntity.ok(threadService.getAllMainThreads());
    }

    // Get thread by ID
    @GetMapping("/{id}")
    public ResponseEntity<ThreadDTO> getThreadById(@PathVariable Long id) {
        return ResponseEntity.ok(threadService.getThreadById(id));
    }

    // Create new thread
    @PostMapping
    public ResponseEntity<ThreadDTO> createThread(@RequestBody ThreadDTO threadDTO) {
        return new ResponseEntity<>(threadService.createThread(threadDTO), HttpStatus.CREATED);
    }

    // Update thread
    @PutMapping("/{id}")
    public ResponseEntity<ThreadDTO> updateThread(@PathVariable Long id, @RequestBody ThreadDTO threadDTO) {
        return ResponseEntity.ok(threadService.updateThread(id, threadDTO));
    }

    // Delete thread
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThread(@PathVariable Long id) {
        threadService.deleteThread(id);
        return ResponseEntity.noContent().build();
    }

    // Add user to thread
    @PostMapping("/{threadId}/users/{userId}")
    public ResponseEntity<Void> addUserToThread(@PathVariable Long threadId, @PathVariable Long userId) {
        threadService.addUserToThread(threadId, userId);
        return ResponseEntity.noContent().build();
    }

    // Remove user from thread
    @DeleteMapping("/{threadId}/users/{userId}")
    public ResponseEntity<Void> removeUserFromThread(@PathVariable Long threadId, @PathVariable Long userId) {
        threadService.removeUserFromThread(threadId, userId);
        return ResponseEntity.noContent().build();
    }

    // Add course to thread
    @PostMapping("/{threadId}/courses/{courseId}")
    public ResponseEntity<Void> addCourseToThread(@PathVariable Long threadId, @PathVariable Long courseId) {
        threadService.addCourseToThread(threadId, courseId);
        return ResponseEntity.noContent().build();
    }

    // Remove course from thread
    @DeleteMapping("/{threadId}/courses/{courseId}")
    public ResponseEntity<Void> removeCourseFromThread(@PathVariable Long threadId, @PathVariable Long courseId) {
        threadService.removeCourseFromThread(threadId, courseId);
        return ResponseEntity.noContent().build();
    }

    // Get threads by course ID
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ThreadDTO>> getThreadsByCourseId(@PathVariable Long courseId) {
        return ResponseEntity.ok(threadService.getThreadsByCourseId(courseId));
    }

    // Get threads by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ThreadDTO>> getThreadsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(threadService.getThreadsByUserId(userId));
    }

    @GetMapping("/{threadId}/users")
    public ResponseEntity<List<UserDTO>> getUsersByThreadId(@PathVariable Long threadId) {
        return ResponseEntity.ok(threadService.getUsersByThreadId(threadId));
    }
}
