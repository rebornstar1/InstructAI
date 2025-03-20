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
}
