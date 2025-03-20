package com.screening.interviews.controller;


import com.screening.interviews.dto.JobDTO;
import com.screening.interviews.model.Job;
import com.screening.interviews.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JobController {

    @Autowired
    private JobService jobService;

    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    @GetMapping("/{id}")
    public Job getJobById(@PathVariable UUID id) {
        return jobService.getJobById(id);
    }

    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobService.createJob(job);
    }

    @PutMapping("/{id}")
    public Job updateJob(@PathVariable UUID id, @RequestBody Job jobDetails) {
        return jobService.updateJob(id, jobDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteJob(@PathVariable UUID id) {
        jobService.deleteJob(id);
    }

    @PutMapping("/{jobId}/assignTest/{testId}")
    public JobDTO assignTestToJob(@PathVariable UUID jobId, @PathVariable Long testId) {
        // First, retrieve the job (if not found, the service will throw an exception)
        Job job = jobService.getJobById(jobId);
        // Set the test id (each job can have at most one test id)
        job.setTestId(testId);
        // Save the updated job
        Job updatedJob = jobService.createJob(job); // or updateJob(jobId, job) depending on your implementation

        JobDTO dto = new JobDTO();
        dto.setId(updatedJob.getId());
        dto.setTitle(updatedJob.getTitle());
        dto.setDepartment(updatedJob.getDepartment());
        dto.setLocation(updatedJob.getLocation());
        dto.setEmploymentType(updatedJob.getEmploymentType());
        dto.setDescription(updatedJob.getDescription());
        dto.setRecruiterId(updatedJob.getRecruiterId());
        dto.setTestId(updatedJob.getTestId());
        dto.setCreatedAt(updatedJob.getCreatedAt());
        dto.setUpdatedAt(updatedJob.getUpdatedAt());
        return dto;
    }
}