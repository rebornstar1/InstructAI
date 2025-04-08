package com.screening.interviews.service;

import com.screening.interviews.dto.community.ThreadDTO;
import com.screening.interviews.dto.community.UserDTO;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Course;
import com.screening.interviews.model.User;
import com.screening.interviews.model.Thread;
import com.screening.interviews.repo.CourseRepository;
import com.screening.interviews.repo.UserRepository;
import com.screening.interviews.repo.ThreadRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ThreadService {

    @Autowired
    private ThreadRepository threadRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all main threads (top-level threads with no parent)
    public List<ThreadDTO> getAllMainThreads() {
        return threadRepository.findByParentThreadIsNull().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get a thread by ID
    public ThreadDTO getThreadById(Long id) {
        Thread thread = threadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + id));
        return convertToDTO(thread);
    }

    // Create a new thread
    @Transactional
    public ThreadDTO createThread(ThreadDTO threadDTO) {
        Thread thread = convertToEntity(threadDTO);
        Thread savedThread = threadRepository.save(thread);
        return convertToDTO(savedThread);
    }

    // Update an existing thread
    @Transactional
    public ThreadDTO updateThread(Long id, ThreadDTO threadDTO) {
        Thread existingThread = threadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + id));

        existingThread.setName(threadDTO.getName());
        existingThread.setDescription(threadDTO.getDescription());
        existingThread.setActive(threadDTO.isActive());

        // Update parent thread if needed
        if (threadDTO.getParentThreadId() != null) {
            Thread parentThread = threadRepository.findById(threadDTO.getParentThreadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent thread not found with id: " + threadDTO.getParentThreadId()));
            existingThread.setParentThread(parentThread);
        } else {
            existingThread.setParentThread(null);
        }

        // Update related courses
        if (threadDTO.getRelatedCourseIds() != null) {
            List<Course> newCourses = new ArrayList<>();
            threadDTO.getRelatedCourseIds().forEach(courseId -> {
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
                newCourses.add(course);
            });

            // Remove old relationships
            List<Course> coursesToRemove = new ArrayList<>(existingThread.getRelatedCourses());
            for (Course course : coursesToRemove) {
                existingThread.removeRelatedCourse(course);
            }

            // Add new relationships
            for (Course course : newCourses) {
                existingThread.addRelatedCourse(course);
            }
        }

        Thread updatedThread = threadRepository.save(existingThread);
        return convertToDTO(updatedThread);
    }

    // Delete a thread
    @Transactional
    public void deleteThread(Long id) {
        Thread thread = threadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + id));

        // Move subthreads to parent if exists, otherwise make them top-level threads
        if (thread.getParentThread() != null) {
            Thread parentThread = thread.getParentThread();
            // Create a new list to avoid ConcurrentModificationException
            List<Thread> subThreadsCopy = new ArrayList<>(thread.getSubThreads());
            for (Thread subThread : subThreadsCopy) {
                subThread.setParentThread(parentThread);
                threadRepository.save(subThread);
            }
        } else {
            // Create a new list to avoid ConcurrentModificationException
            List<Thread> subThreadsCopy = new ArrayList<>(thread.getSubThreads());
            for (Thread subThread : subThreadsCopy) {
                subThread.setParentThread(null);
                threadRepository.save(subThread);
            }
        }

        threadRepository.delete(thread);
    }

    // Add a user to a thread
    @Transactional
    public void addUserToThread(Long threadId, Long userId) {
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + threadId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        thread.addMember(user);
        threadRepository.save(thread);
    }

    // Remove a user from a thread
    @Transactional
    public void removeUserFromThread(Long threadId, Long userId) {
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + threadId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        thread.removeMember(user);
        threadRepository.save(thread);
    }

    // Add course to thread
    @Transactional
    public void addCourseToThread(Long threadId, Long courseId) {
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + threadId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        thread.addRelatedCourse(course);
        threadRepository.save(thread);
    }

    // Remove course from thread
    @Transactional
    public void removeCourseFromThread(Long threadId, Long courseId) {
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + threadId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        thread.removeRelatedCourse(course);
        threadRepository.save(thread);
    }

    // Get threads by course ID
    public List<ThreadDTO> getThreadsByCourseId(Long courseId) {
        return threadRepository.findByCourseId(courseId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get threads by user ID
    public List<ThreadDTO> getThreadsByUserId(Long userId) {
        return threadRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods for DTO conversion
    private ThreadDTO convertToDTO(Thread thread) {
        ThreadDTO dto = new ThreadDTO();
        dto.setId(thread.getId());
        dto.setName(thread.getName());
        dto.setDescription(thread.getDescription());
        dto.setCreatedAt(thread.getCreatedAt());
        dto.setActive(thread.isActive());

        if (thread.getParentThread() != null) {
            dto.setParentThreadId(thread.getParentThread().getId());
        }

        dto.setSubThreadIds(thread.getSubThreads().stream()
                .map(Thread::getId)
                .collect(Collectors.toList()));

        dto.setRelatedCourseIds(thread.getRelatedCourses().stream()
                .map(Course::getId)
                .collect(Collectors.toList()));

        return dto;
    }

    private Thread convertToEntity(ThreadDTO dto) {
        Thread thread = new Thread();
        thread.setName(dto.getName());
        thread.setDescription(dto.getDescription());
        thread.setActive(dto.isActive());

        if (dto.getParentThreadId() != null) {
            Thread parentThread = threadRepository.findById(dto.getParentThreadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent thread not found with id: " + dto.getParentThreadId()));
            thread.setParentThread(parentThread);
        }

        if (dto.getRelatedCourseIds() != null) {
            List<Course> courses = new ArrayList<>();
            for (Long courseId : dto.getRelatedCourseIds()) {
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
                courses.add(course);
            }

            // Add all courses at once
            for (Course course : courses) {
                thread.addRelatedCourse(course);
            }
        }

        return thread;
    }

    public List<UserDTO> getUsersByThreadId(Long threadId) {
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found with id: " + threadId));

        return thread.getMembers().stream()
                .map(this::convertUserToDTO)
                .collect(Collectors.toList());
    }

    // Helper method to convert User to UserDTO
    private UserDTO convertUserToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        // Add other user properties as needed
        return dto;
    }
}