package com.screening.interviews.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
//    @Value("${gemini.api.base-url}")
    private String baseUrl = "https://generativelanguage.googleapis.com";

//    @Value("${gemini.api.key}")
    private String apiKey = "AIzaSyCcTsDBMal4lRkGCjxy6dIwFcaWGRG4ntU";

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)  // Ensure correct base URL
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("x-goog-api-key", apiKey) // Pass API key
                .build();
    }

}