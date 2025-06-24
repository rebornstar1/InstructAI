package com.screening.interviews.dto.community;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class MessageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("id")
    private Long id;

    @JsonProperty("conversationId")
    private Long conversationId;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("content")
    private String content;

    @JsonProperty("messageType")
    private String messageType;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("conceptTags")
    private List<String> conceptTags = new ArrayList<>();

    @JsonProperty("replyToMessageId")
    private Long replyToMessageId;

    @JsonProperty("isTopLevelMessage")
    private boolean isTopLevelMessage = true;

    @JsonProperty("replies")
    private List<MessageDTO> replies;

    // Additional constructor for Jackson with explicit parameter names
    @JsonCreator
    public MessageDTO(
            @JsonProperty("id") Long id,
            @JsonProperty("conversationId") Long conversationId,
            @JsonProperty("userId") Long userId,
            @JsonProperty("content") String content,
            @JsonProperty("messageType") String messageType,
            @JsonProperty("timestamp") LocalDateTime timestamp,
            @JsonProperty("conceptTags") List<String> conceptTags,
            @JsonProperty("replyToMessageId") Long replyToMessageId,
            @JsonProperty("isTopLevelMessage") boolean isTopLevelMessage,
            @JsonProperty("replies") List<MessageDTO> replies) {
        this.id = id;
        this.conversationId = conversationId;
        this.userId = userId;
        this.content = content;
        this.messageType = messageType;
        this.timestamp = timestamp;
        this.conceptTags = conceptTags != null ? conceptTags : new ArrayList<>();
        this.replyToMessageId = replyToMessageId;
        this.isTopLevelMessage = isTopLevelMessage;
        this.replies = replies;
    }
}