package com.screening.interviews.dto;

import java.util.List;

public class CandidateComparisonResponseDto {
    private List<String> pros;
    private List<String> cons;

    public List<String> getPros() {
        return pros;
    }

    public void setPros(List<String> pros) {
        this.pros = pros;
    }

    public List<String> getCons() {
        return cons;
    }

    public void setCons(List<String> cons) {
        this.cons = cons;
    }
}