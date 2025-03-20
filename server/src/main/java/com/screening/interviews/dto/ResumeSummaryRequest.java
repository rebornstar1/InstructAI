package com.screening.interviews.dto;

public class ResumeSummaryRequest {
    private String content;

    public ResumeSummaryRequest() {
    }

    public ResumeSummaryRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}