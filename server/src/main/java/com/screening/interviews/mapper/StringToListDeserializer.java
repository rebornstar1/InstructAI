package com.screening.interviews.mapper;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Custom deserializer that can handle both string and array inputs for List fields.
 * If the input is a string, it converts it to a single-element list.
 * If the input is an array, it processes it normally.
 */
public class StringToListDeserializer extends JsonDeserializer<List<String>> {

    @Override
    public List<String> deserialize(JsonParser p, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {

        JsonNode node = p.getCodec().readTree(p);

        // Handle various input types
        if (node.isArray()) {
            // Normal array handling
            List<String> result = new ArrayList<>();
            node.forEach(item -> result.add(item.asText()));
            return result;
        } else if (node.isTextual()) {
            // Convert string to single-element list
            String text = node.asText();

            // If it looks like a comma-separated list, try to split it
            if (text.contains(",")) {
                return Arrays.asList(text.split("\\s*,\\s*"));
            }

            // Otherwise, treat as a single item
            return Collections.singletonList(text);
        } else if (node.isNull()) {
            // Handle null values
            return new ArrayList<>();
        }

        // Default to empty list for unexpected types
        return new ArrayList<>();
    }
}