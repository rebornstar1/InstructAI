package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.User;
import com.screening.interviews.model.UserCourseProgress;
import com.screening.interviews.model.UserModuleProgress;
import com.screening.interviews.service.CourseService;
import com.screening.interviews.service.ProgressService;
import com.screening.interviews.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses/simplified")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;
    private final ProgressService progressService;
    private final UserService userService;

    @PostMapping("/generate")
    public ResponseEntity<CourseResponseDto> generateCourse(@RequestBody CourseRequestDto request) {
        CourseResponseDto courseResponse = courseService.generateCourse(request);
        return ResponseEntity.ok(courseResponse);
    }

    
    // GET all request
    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getAllCourses() {
        List<CourseResponseDto> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    // GET request
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourse(@PathVariable Long id) {
        CourseResponseDto dto = courseService.getCourseById(id);
        return ResponseEntity.ok(dto);
    }

    // PUT or PATCH request (full or partial update)
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponseDto> updateCourse(
            @PathVariable Long id,
            @RequestBody CourseRequestDto request
    ) {
        CourseResponseDto updated = courseService.updateCourse(id, request);
        return ResponseEntity.ok(updated);
    }

    // DELETE request
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/with-progress")
    public ResponseEntity<EnhancedCourseResponseDto> getCourseWithProgress(@PathVariable Long id) {
        // Get the course
        CourseResponseDto course = courseService.getCourseById(id);

        // Get the current user
        User currentUser = userService.getCurrentUser();

        // Initialize course progress (ensure the user is enrolled)
        UserCourseProgress courseProgress;
        try {
            courseProgress = progressService.getCourseProgress(currentUser.getId(), id);
        } catch (ResourceNotFoundException e) {
            // If not enrolled, enroll the user
            courseProgress = progressService.enrollInCourse(currentUser.getId(), id);
        }

        // Get module progress for each module
        Map<Long, ModuleProgressDto> moduleProgressMap = new HashMap<>();

        for (ModuleDto module : course.getModules()) {
            try {
                UserModuleProgress moduleProgress = progressService.getModuleProgress(
                        currentUser.getId(), module.getId());
                moduleProgressMap.put(module.getId(), ModuleProgressDto.fromEntity(moduleProgress));
            } catch (ResourceNotFoundException e) {
                // Skip modules without progress
            }
        }

        // Create the enhanced response
        EnhancedCourseResponseDto enhancedResponse = EnhancedCourseResponseDto.builder()
                .course(course)
                .courseProgress(CourseProgressDto.fromEntity(courseProgress))
                .moduleProgressMap(moduleProgressMap)
                .build();

        return ResponseEntity.ok(enhancedResponse);
    }

    /**
     * Get all courses with progress information
     */
    @GetMapping("/with-progress")
    public ResponseEntity<List<CourseProgressDto>> getAllCoursesWithProgress() {
        User currentUser = userService.getCurrentUser();
        List<UserCourseProgress> progressList = progressService.getAllCourseProgress(currentUser.getId());

        List<CourseProgressDto> dtoList = progressList.stream()
                .map(CourseProgressDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }
}
