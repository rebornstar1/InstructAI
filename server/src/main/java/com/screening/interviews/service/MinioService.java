package com.screening.interviews.service;

import io.minio.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    // 7 days in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
    // NOTE: Changed from 21 weeks to 7 days to comply with MinIO restrictions
    private static final int EXPIRY_TIME_SECONDS = 7 * 24 * 60 * 60;

    @PostConstruct
    public void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to ensure bucket exists: " + e.getMessage());
        }
    }

    public Map<String, String> uploadFile(MultipartFile file) {
        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        try (InputStream inputStream = file.getInputStream()) {
            // Upload file to MinIO
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(fileName)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            // Generate presigned URL with 7-day expiration (MinIO limitation)
            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(fileName)
                            .expiry(EXPIRY_TIME_SECONDS, TimeUnit.SECONDS)
                            .build());

            // Return both the file name and the presigned URL
            Map<String, String> result = new HashMap<>();
            result.put("fileName", fileName);
            result.put("fileUrl", presignedUrl);
            result.put("expiresAfter", "7 days"); // Changed from "21 weeks" to "7 days"

            return result;
        } catch (Exception e) {
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    public String getFileUrl(String fileName) {
        try {
            // Generate presigned URL with 7-day expiration
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(fileName)
                            .expiry(EXPIRY_TIME_SECONDS, TimeUnit.SECONDS)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate file URL: " + e.getMessage());
        }
    }
}