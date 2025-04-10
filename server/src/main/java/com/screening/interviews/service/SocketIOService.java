// SocketIOService.java
package com.screening.interviews.service;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocketIOService implements SmartLifecycle {

    private static final Logger logger = LoggerFactory.getLogger(SocketIOService.class);

    private final SocketIOServer server;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private boolean running = false;

    // Map of session id to client
    private final Map<String, SocketIOClient> clients = new ConcurrentHashMap<>();

    // Map of conversation id to list of clients in that conversation
    private final Map<String, Map<String, SocketIOClient>> conversationClients = new ConcurrentHashMap<>();

    @Autowired
    public SocketIOService(SocketIOServer server) {
        this.server = server;
    }

    @Override
    public void start() {
        logger.info("Starting SocketIO server on port {}", server.getConfiguration().getPort());
        server.start();
        running = true;
    }

    @Override
    public void stop() {
        logger.info("Stopping SocketIO server");
        server.stop();
        running = false;
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    @Override
    public void stop(Runnable callback) {
        stop();
        callback.run();
    }

    @Override
    public int getPhase() {
        return Integer.MAX_VALUE; // Last to stop, first to start
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String sessionId = client.getSessionId().toString();
        logger.info("Client connected: {}", sessionId);

        // Store the client
        clients.put(sessionId, client);

        // Extract user information from handshake data if available
        String userId = client.getHandshakeData().getSingleUrlParam("userId");
        String username = client.getHandshakeData().getSingleUrlParam("username");

        if (userId != null && username != null) {
            logger.info("User connected: {}({})", username, userId);
        }
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        String sessionId = client.getSessionId().toString();
        logger.info("Client disconnected: {}", sessionId);

        // Remove the client
        clients.remove(sessionId);

        // Remove from all conversation maps
        for (Map<String, SocketIOClient> conversationMap : conversationClients.values()) {
            conversationMap.remove(sessionId);
        }
    }

    @OnEvent("JOIN")
    public void onJoinEvent(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        try {
            logger.info("JOIN event received: {}", data);
            Object conversationIdObj = data.get("conversationId");
            String conversationId = String.valueOf(conversationIdObj);

            if (conversationId == null) {
                logger.error("Invalid JOIN event: missing conversationId");
                if (ackRequest.isAckRequested()) {
                    ackRequest.sendAckData(Map.of("status", "error", "message", "Missing conversationId"));
                }
                return;
            }

            // Add the client to the conversation
            conversationClients.computeIfAbsent(conversationId, k -> new ConcurrentHashMap<>())
                    .put(client.getSessionId().toString(), client);

            // Broadcast join notification to conversation members
            broadcastToConversation(conversationId, data);

            // Send acknowledgment if requested
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "ok"));
            }
        } catch (Exception e) {
            logger.error("Error handling JOIN event", e);
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "error", "message", e.getMessage()));
            }
        }
    }

    @OnEvent("LEAVE")
    public void onLeaveEvent(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        try {
            logger.info("LEAVE event received: {}", data);
            Object conversationIdObj = data.get("conversationId");
            String conversationId = String.valueOf(conversationIdObj);

            if (conversationId == null) {
                logger.error("Invalid LEAVE event: missing conversationId");
                if (ackRequest.isAckRequested()) {
                    ackRequest.sendAckData(Map.of("status", "error", "message", "Missing conversationId"));
                }
                return;
            }

            // Remove the client from the conversation
            Map<String, SocketIOClient> conversationMap = conversationClients.get(conversationId);
            if (conversationMap != null) {
                conversationMap.remove(client.getSessionId().toString());

                // Broadcast leave notification to conversation members
                broadcastToConversation(conversationId, data);
            }

            // Send acknowledgment if requested
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "ok"));
            }
        } catch (Exception e) {
            logger.error("Error handling LEAVE event", e);
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "error", "message", e.getMessage()));
            }
        }
    }

    @OnEvent("CHAT")
    public void onChatEvent(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        try {
            logger.info("CHAT event received from {}: {}", client.getSessionId(), data);
            Object conversationIdObj = data.get("conversationId");
            String conversationId = String.valueOf(conversationIdObj);

            if (conversationId == null) {
                logger.error("Invalid CHAT event: missing conversationId");
                if (ackRequest.isAckRequested()) {
                    ackRequest.sendAckData(Map.of("status", "error", "message", "Missing conversationId"));
                }
                return;
            }

            // Broadcast the chat message to conversation members
            broadcastToConversation(conversationId, data);

            // Send acknowledgment if requested
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "ok", "messageId", data.get("messageId")));
            }
        } catch (Exception e) {
            logger.error("Error handling CHAT event", e);
            if (ackRequest.isAckRequested()) {
                ackRequest.sendAckData(Map.of("status", "error", "message", e.getMessage()));
            }
        }
    }

    @OnEvent("TYPING")
    public void onTypingEvent(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        try {
            Object conversationIdObj = data.get("conversationId");
            String conversationId = String.valueOf(conversationIdObj);

            if (conversationId == null) {
                logger.error("Invalid TYPING event: missing conversationId");
                return;
            }

            // Broadcast typing indicator to conversation members
            broadcastToConversation(conversationId, data);
        } catch (Exception e) {
            logger.error("Error handling TYPING event", e);
        }
    }

    @OnEvent("ping")
    public void onPing(SocketIOClient client, AckRequest ackRequest) {
        logger.debug("Ping received from client: {}", client.getSessionId());
        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData();
        }
    }

    private void broadcastToConversation(String conversationId, Map<String, Object> data) {
        Map<String, SocketIOClient> conversationMap = conversationClients.get(conversationId);

        if (conversationMap != null) {
            String eventType = (String) data.get("type");
            logger.debug("Broadcasting {} event to {} clients in conversation {}",
                    eventType, conversationMap.size(), conversationId);

            for (SocketIOClient client : conversationMap.values()) {
                if (client.isChannelOpen()) {
                    client.sendEvent(eventType, data);
                }
            }
        } else {
            logger.warn("Attempted to broadcast to non-existent conversation: {}", conversationId);
        }
    }
}