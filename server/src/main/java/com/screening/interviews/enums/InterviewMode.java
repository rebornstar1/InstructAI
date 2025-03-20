package com.screening.interviews.enums;

public enum InterviewMode {
    VIRTUAL("virtual"),
    ON_SITE("on_site");

    private final String value;

    InterviewMode(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
