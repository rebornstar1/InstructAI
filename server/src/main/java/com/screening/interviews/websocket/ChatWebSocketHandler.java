// ChatWebSocketHandler.java
package com.screening.interviews.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map of session id to session object
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // Map of conversation id to list of sessions in that conversation
    private final Map<String, Map<String, WebSocketSession>> conversationSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // Store the session
        sessions.put(session.getId(), session);
        System.out.println("New WebSocket connection: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Remove the session
        sessions.remove(session.getId());

        // Remove from all conversation maps
        for (Map<String, WebSocketSession> conversationMap : conversationSessions.values()) {
            conversationMap.remove(session.getId());
        }

        System.out.println("WebSocket connection closed: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        Map<String, Object> messageMap = objectMapper.readValue(payload, Map.class);

        // Extract message type and conversation id
        String type = (String) messageMap.get("type");
        String conversationId = (String) messageMap.get("conversationId");

        if (type == null || conversationId == null) {
            System.err.println("Invalid message format: missing type or conversationId");
            return;
        }

        // Handle different message types
        switch (type) {
            case "JOIN":
                handleJoinConversation(session, conversationId, messageMap);
                break;
            case "LEAVE":
                handleLeaveConversation(session, conversationId, messageMap);
                break;
            case "CHAT":
                handleChatMessage(session, conversationId, messageMap);
                break;
            case "TYPING":
                handleTypingIndicator(session, conversationId, messageMap);
                break;
            default:
                System.err.println("Unknown message type: " + type);
        }
    }

    private void handleJoinConversation(WebSocketSession session, String conversationId, Map<String, Object> messageMap) throws IOException {
        // Add the session to the conversation
        conversationSessions.computeIfAbsent(conversationId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);

        // Broadcast join notification to conversation members
        broadcastToConversation(conversationId, messageMap);
    }

    private void handleLeaveConversation(WebSocketSession session, String conversationId, Map<String, Object> messageMap) throws IOException {
        // Remove the session from the conversation
        Map<String, WebSocketSession> conversationMap = conversationSessions.get(conversationId);
        if (conversationMap != null) {
            conversationMap.remove(session.getId());

            // Broadcast leave notification to conversation members
            broadcastToConversation(conversationId, messageMap);
        }
    }

    private void handleChatMessage(WebSocketSession session, String conversationId, Map<String, Object> messageMap) throws IOException {
        // Broadcast the chat message to conversation members
        broadcastToConversation(conversationId, messageMap);
    }

    private void handleTypingIndicator(WebSocketSession session, String conversationId, Map<String, Object> messageMap) throws IOException {
        // Broadcast typing indicator to conversation members
        broadcastToConversation(conversationId, messageMap);
    }

    private void broadcastToConversation(String conversationId, Map<String, Object> messageMap) throws IOException {
        Map<String, WebSocketSession> conversationMap = conversationSessions.get(conversationId);
        if (conversationMap != null) {
            String messageJson = objectMapper.writeValueAsString(messageMap);
            TextMessage textMessage = new TextMessage(messageJson);

            for (WebSocketSession session : conversationMap.values()) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        System.err.println("Error sending message to session " + session.getId() + ": " + e.getMessage());
                    }
                }
            }
        }
    }
}