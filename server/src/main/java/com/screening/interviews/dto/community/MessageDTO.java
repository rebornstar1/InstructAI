package com.screening.interviews.dto.community;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class MessageDTO {
    private Long id;
    private Long conversationId;
    private Long userId;
    // Changed from Object to String
    private String content;
    private String messageType;
    private LocalDateTime timestamp;
    private List<String> conceptTags = new ArrayList<>();

    // For replies, this will contain the parent message ID
    // For top-level messages, this will be null
    private Long replyToMessageId;

    // Explicit flag to indicate if this is a top-level message
    private boolean isTopLevelMessage = true;

    // Optional field to include replies to this message (populated only when needed)
    private List<MessageDTO> replies;
}