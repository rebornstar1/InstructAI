package com.screening.interviews.dto;

// Response DTO for document parsing and summarization
public class DocumentParseResponse {
    private String content;
    private String summary;

    public DocumentParseResponse() {
    }

    public DocumentParseResponse(String content, String summary) {
        this.content = content;
        this.summary = summary;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}