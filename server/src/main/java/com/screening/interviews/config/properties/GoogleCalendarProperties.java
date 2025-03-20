package com.screening.interviews.config.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "google.calendar")
public class GoogleCalendarProperties {
    private String applicationName;
    private String timeZone;
    private Integer defaultMeetingDurationMinutes = 60;
}