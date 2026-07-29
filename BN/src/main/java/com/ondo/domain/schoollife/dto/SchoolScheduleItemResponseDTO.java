package com.ondo.domain.schoollife.dto;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class SchoolScheduleItemResponseDTO {

    private final LocalDate date;
    private final String eventName;
    private final String eventContent;

    public SchoolScheduleItemResponseDTO(LocalDate date, String eventName, String eventContent) {
        this.date = date;
        this.eventName = eventName;
        this.eventContent = eventContent;
    }
}
