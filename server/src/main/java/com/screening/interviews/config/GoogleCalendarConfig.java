package com.screening.interviews.config;

import com.google.api.client.http.HttpRequestInitializer;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
@Configuration
public class GoogleCalendarConfig {

    @Value("${google.calendar.application-name}")
    private String applicationName;

    @Value("${google.calendar.service-account-user}")  // Add this
    private String serviceAccountUser;  // The email to impersonate

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        return GoogleCredentials.fromStream(
                        new ClassPathResource("google-credentials.json").getInputStream()
                )
                .createScoped(Collections.singleton(CalendarScopes.CALENDAR))
                .createDelegated(serviceAccountUser);  // Add this line
    }

    @Bean
    public Calendar googleCalendar(GoogleCredentials credentials)
            throws GeneralSecurityException, IOException {
        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                requestInitializer
        )
                .setApplicationName(applicationName)
                .build();
    }
}