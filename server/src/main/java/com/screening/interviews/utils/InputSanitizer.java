package com.screening.interviews.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for sanitizing and validating user inputs
 */
@Component
public class InputSanitizer {

    private static final Logger logger = LoggerFactory.getLogger(InputSanitizer.class);

    /**
     * Sanitizes user input to prevent injection attacks and handle special characters
     * @param input The user input to sanitize
     * @return Sanitized input string
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }

        // Remove control characters
        String sanitized = input.replaceAll("[\\p{Cntrl}]", "");

        // Handle HTML/XML tags - convert to HTML entities
        sanitized = sanitized.replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;");

        // Limit input length to reasonable size
        if (sanitized.length() > 1000) {
            logger.warn("Input exceeds maximum length, truncating: {}", sanitized.substring(0, 50) + "...");
            sanitized = sanitized.substring(0, 1000);
        }

        return sanitized;
    }

    /**
     * Sanitizes a map of user answers
     * @param answers Map of user answers
     * @return Sanitized map of answers
     */
    public Map<String, String> sanitizeAnswers(Map<String, String> answers) {
        if (answers == null) {
            return new HashMap<>();
        }

        Map<String, String> sanitizedAnswers = new HashMap<>();

        for (Map.Entry<String, String> entry : answers.entrySet()) {
            String key = sanitizeInput(entry.getKey());
            String value = sanitizeInput(entry.getValue());

            sanitizedAnswers.put(key, value);
        }

        return sanitizedAnswers;
    }

    /**
     * Validates if the input contains potentially harmful content
     * @param input The input to validate
     * @return true if input appears safe, false otherwise
     */
    public boolean isValidInput(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }

        // Check for script tags or other potentially harmful patterns
        boolean containsScriptTags = input.toLowerCase().contains("<script");
        boolean containsSqlInjection = input.toLowerCase().contains("drop table") ||
                input.toLowerCase().contains("delete from") ||
                input.toLowerCase().contains("update ") && input.toLowerCase().contains("set ");

        return !containsScriptTags && !containsSqlInjection;
    }

    /**
     * Escapes special characters in the input for use in JSON
     * @param input The input to escape
     * @return JSON-safe string
     */
    public String escapeForJson(String input) {
        if (input == null) {
            return "";
        }

        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Handle mathematical symbols and other special characters
     * @param input The input containing mathematical symbols
     * @return Properly escaped string
     */
    public String handleSpecialSymbols(String input) {
        if (input == null) {
            return "";
        }

        // Unicode normalization to handle composite characters
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFC);

        // Convert potentially problematic mathematical symbols to their Unicode names or equivalent ASCII
        Map<String, String> symbolMap = new HashMap<>();
        symbolMap.put("±", "plus-minus");
        symbolMap.put("×", "multiply");
        symbolMap.put("÷", "divide");
        symbolMap.put("√", "square root");
        symbolMap.put("∫", "integral");
        symbolMap.put("∑", "sum");
        symbolMap.put("∏", "product");
        symbolMap.put("∞", "infinity");
        symbolMap.put("≈", "approximately");
        symbolMap.put("≠", "not equal");
        symbolMap.put("≤", "less than or equal");
        symbolMap.put("≥", "greater than or equal");

        // Replace symbols if needed for display context
        // For storage/processing, keeping Unicode is usually better
        if (isReplaceSymbolsNeeded()) {
            for (Map.Entry<String, String> symbol : symbolMap.entrySet()) {
                normalized = normalized.replace(symbol.getKey(), symbol.getValue());
            }
        }

        return normalized;
    }

    /**
     * Determines if symbol replacement is needed based on context
     * This can be configured based on where the text will be used
     */
    private boolean isReplaceSymbolsNeeded() {
        // This can be configured through application properties
        return false; // Default to false - keep symbols as Unicode
    }
}