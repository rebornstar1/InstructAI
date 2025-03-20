//package com.screening.interviews.enums;
//
//public enum InterviewStatus {
//    SCHEDULED("scheduled"),
//    COMPLETED("completed"),
//    CANCELLED("cancelled");
//
//    private final String value;
//
//    InterviewStatus(String value) {
//        this.value = value;
//    }
//
//    public String getValue() {
//        return value;
//    }
//}

package com.screening.interviews.enums;

public enum InterviewStatus {
    SCHEDULED("scheduled"),
    COMPLETED_COMPLETED("completed_completed"),
    COMPLETED_OVERDUE("completed_overdue"),
    CANCELLED("cancelled");


    private final String value;

    InterviewStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
