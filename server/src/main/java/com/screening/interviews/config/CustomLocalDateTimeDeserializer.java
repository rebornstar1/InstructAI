package com.screening.interviews.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class CustomLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {
    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getText();
        try {
            return ZonedDateTime.parse(dateString).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateString);
            } catch (Exception ex) {
                throw new RuntimeException("Error parsing date: " + dateString, ex);
            }
        }
    }
}