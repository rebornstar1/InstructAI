package com.screening.interviews.controller;

import com.screening.interviews.model.JobApplication;
import com.screening.interviews.service.JobApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-applications")
public class JobApplicationController {

    @Autowired
    private JobApplicationService jobApplicationService;

    @GetMapping
    public List<JobApplication> getAllJobApplications() {
        return jobApplicationService.getAllJobApplications();
    }

    @GetMapping("/{id}")
    public JobApplication getJobApplicationById(@PathVariable UUID id) {
        return jobApplicationService.getJobApplicationById(id);
    }

    @PostMapping
    public JobApplication createJobApplication(@RequestBody JobApplication jobApplication) {
        return jobApplicationService.createJobApplication(jobApplication);
    }

    @PutMapping("/{id}")
    public JobApplication updateJobApplication(@PathVariable UUID id, @RequestBody JobApplication jobApplicationDetails) {
        return jobApplicationService.updateJobApplication(id, jobApplicationDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteJobApplication(@PathVariable UUID id) {
        jobApplicationService.deleteJobApplication(id);
    }
}