package com.screening.interviews.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Custom deserializer for prerequisites field to handle both string and array formats
 */
public class PrerequisitesDeserializer extends JsonDeserializer<Object> {

    @Override
    public Object deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);

        // If it's already an array, parse it as an array
        if (node.isArray()) {
            List<String> prerequisites = new ArrayList<>();
            for (JsonNode item : node) {
                prerequisites.add(item.asText());
            }
            return prerequisites;
        }
        // If it's a string, return it as is
        else if (node.isTextual()) {
            return node.asText();
        }
        // If it's neither, return an empty list
        return new ArrayList<>();
    }
}