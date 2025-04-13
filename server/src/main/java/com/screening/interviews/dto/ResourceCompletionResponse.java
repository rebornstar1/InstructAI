package com.screening.interviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceCompletionResponse {
    private boolean success;
    private String resourceType;
    private boolean resourceCompleted;

    // Term status
    private boolean termCompleted;
    private Integer termIndex;

    // Next term info if this term was completed
    private boolean nextTermUnlocked;
    private Integer nextTermIndex;

    // Module progress info
    private int moduleProgressPercentage;
    private boolean moduleCompleted;
}