package com.screening.interviews.enums;

public enum Recommendation {
    PROCEED("proceed"),
    REJECT("reject"),
    HIRE("hire");

    private final String value;

    Recommendation(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
