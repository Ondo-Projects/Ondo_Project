package com.ondo.domain.schoollife.dto;

import lombok.Getter;

@Getter
public class TimetablePeriodResponseDTO {

    private final int period;
    private final String subject;
    private final String classroom;

    public TimetablePeriodResponseDTO(int period, String subject, String classroom) {
        this.period = period;
        this.subject = subject;
        this.classroom = classroom;
    }
}
