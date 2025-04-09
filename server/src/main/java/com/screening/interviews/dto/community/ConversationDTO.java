package com.screening.interviews.dto.community;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class ConversationDTO {
    private Long id;
    private String title;
    private Long threadId;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;
    private List<Long> participantIds = new ArrayList<>();
    private List<String> conceptTags = new ArrayList<>();
}