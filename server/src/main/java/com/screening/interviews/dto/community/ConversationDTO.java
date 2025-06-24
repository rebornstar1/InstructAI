package com.screening.interviews.dto.community;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor  // Required for Jackson deserialization
@AllArgsConstructor // Required for @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConversationDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private Long threadId;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;

    @Builder.Default
    private List<Long> participantIds = new ArrayList<>();

    @Builder.Default
    private List<String> conceptTags = new ArrayList<>();
}