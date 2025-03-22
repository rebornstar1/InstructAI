package com.screening.interviews.controller;

import com.screening.interviews.dto.CourseRequestDto;
import com.screening.interviews.dto.CourseResponseDto;
import com.screening.interviews.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/simplified")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    @PostMapping("/generate")
    public ResponseEntity<CourseResponseDto> generateCourse(@RequestBody CourseRequestDto request) {
        CourseResponseDto courseResponse = courseService.generateCourse(request);
        return ResponseEntity.ok(courseResponse);
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
}
