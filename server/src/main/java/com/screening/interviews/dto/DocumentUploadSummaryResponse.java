package com.screening.interviews.dto;

public record DocumentUploadSummaryResponse(
        String fileId,
        String fileName,
        String content,
        String summary
) {}