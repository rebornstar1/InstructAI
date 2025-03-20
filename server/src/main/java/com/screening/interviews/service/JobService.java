package com.screening.interviews.service;


import com.screening.interviews.model.Job;
import com.screening.interviews.repo.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public Job getJobById(UUID id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
    }

    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    public Job updateJob(UUID id, Job jobDetails) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        job.setTitle(jobDetails.getTitle());
        job.setDepartment(jobDetails.getDepartment());
        job.setLocation(jobDetails.getLocation());
        job.setEmploymentType(jobDetails.getEmploymentType());
        job.setDescription(jobDetails.getDescription());
        job.setRecruiterId(jobDetails.getRecruiterId());

        return jobRepository.save(job);
    }

    public void deleteJob(UUID id) {
        jobRepository.deleteById(id);
    }
}
