package com.screening.interviews.service;

import com.screening.interviews.model.JobApplication;
import com.screening.interviews.repo.JobApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class JobApplicationService {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    public List<JobApplication> getAllJobApplications() {
        return jobApplicationRepository.findAll();
    }

    public JobApplication getJobApplicationById(UUID id) {
        return jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job Application not found with id: " + id));
    }

    public JobApplication createJobApplication(JobApplication jobApplication) {
        return jobApplicationRepository.save(jobApplication);
    }

    public JobApplication updateJobApplication(UUID id, JobApplication jobApplicationDetails) {
        JobApplication jobApplication = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job Application not found with id: " + id));
        jobApplication.setCandidateId(jobApplicationDetails.getCandidateId());
        jobApplication.setStatus(jobApplicationDetails.getStatus());
        jobApplication.setJob(jobApplicationDetails.getJob());
        return jobApplicationRepository.save(jobApplication);
    }

    public void deleteJobApplication(UUID id) {
        jobApplicationRepository.deleteById(id);
    }
}