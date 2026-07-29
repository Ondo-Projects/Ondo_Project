package com.ondo.domain.schoollife.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class SchoolScheduleUpcomingResponseDTO {

    private final String schoolName;
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final SchoolScheduleStatus status;
    private final List<SchoolScheduleItemResponseDTO> events;
    private final String message;

    public SchoolScheduleUpcomingResponseDTO(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate,
            SchoolScheduleStatus status,
            List<SchoolScheduleItemResponseDTO> events,
            String message
    ) {
        this.schoolName = schoolName;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.status = status;
        this.events = events;
        this.message = message;
    }

    public static SchoolScheduleUpcomingResponseDTO ok(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate,
            List<SchoolScheduleItemResponseDTO> events,
            String message
    ) {
        return new SchoolScheduleUpcomingResponseDTO(
                schoolName,
                fromDate,
                toDate,
                SchoolScheduleStatus.OK,
                events,
                message
        );
    }

    public static SchoolScheduleUpcomingResponseDTO noEvents(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate,
            String message
    ) {
        return new SchoolScheduleUpcomingResponseDTO(
                schoolName,
                fromDate,
                toDate,
                SchoolScheduleStatus.NO_EVENTS,
                List.of(),
                message
        );
    }

    public static SchoolScheduleUpcomingResponseDTO mappingFailed(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate,
            String message
    ) {
        return new SchoolScheduleUpcomingResponseDTO(
                schoolName,
                fromDate,
                toDate,
                SchoolScheduleStatus.MAPPING_FAILED,
                List.of(),
                message
        );
    }

    public static SchoolScheduleUpcomingResponseDTO unavailable(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate,
            String message
    ) {
        return new SchoolScheduleUpcomingResponseDTO(
                schoolName,
                fromDate,
                toDate,
                SchoolScheduleStatus.UNAVAILABLE,
                List.of(),
                message
        );
    }
}
