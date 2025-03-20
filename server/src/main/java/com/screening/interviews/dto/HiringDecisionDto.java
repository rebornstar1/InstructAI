package com.screening.interviews.dto;

import lombok.Data;

@Data
public class HiringDecisionDto {
    private Long interviewId;
    private boolean sendEmail; // true for sending email on rejection; always sending for hire
    private String emailContent;
}