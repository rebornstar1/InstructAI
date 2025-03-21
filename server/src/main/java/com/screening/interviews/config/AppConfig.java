package com.screening.interviews.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class AppConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public WebClient appWebClient(WebClient.Builder webClientBuilder) {  // Renamed from webClient to appWebClient
        return webClientBuilder.build();
    }
}