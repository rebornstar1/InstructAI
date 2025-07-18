// SocketIOConfig.java
package com.screening.interviews.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Role;

import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;

@Configuration
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:9092}")
    private Integer port;

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    @Lazy
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);

        // Allow all origins for development
        config.setOrigin("*");

        // Configure socket options for better performance
        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setReuseAddress(true);
        config.setSocketConfig(socketConfig);

        // Additional performance settings
        config.setUpgradeTimeout(10000);
        config.setPingTimeout(20000);
        config.setPingInterval(25000);

        // Add CORS headers to socket.io requests
        config.setAllowHeaders("*");

        // For WebSocket fallback options
        config.setTransports(com.corundumstudio.socketio.Transport.POLLING,
                com.corundumstudio.socketio.Transport.WEBSOCKET);

        // Enable WebSocket compression
        config.setWebsocketCompression(true);

        // Important: Allow client to reconnect
        config.setRandomSession(false);

        return new SocketIOServer(config);
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    @Lazy
    public static SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketServer) {
        return new SpringAnnotationScanner(socketServer);
    }
}