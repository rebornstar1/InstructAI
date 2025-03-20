package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    private String fileId;
    private String fileName;
    private String fileUrl;
    private String expiresAfter;
    private String content;
    private String summary;
    private String error;
}