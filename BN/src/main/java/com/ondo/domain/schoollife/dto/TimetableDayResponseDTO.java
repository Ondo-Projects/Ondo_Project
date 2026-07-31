package com.ondo.domain.schoollife.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class TimetableDayResponseDTO {

    private final LocalDate date;
    private final String schoolName;
    private final Integer grade;
    private final Integer classNumber;
    private final TimetableStatus status;
    private final List<TimetablePeriodResponseDTO> periods;
    private final String message;

    public TimetableDayResponseDTO(
            LocalDate date,
            String schoolName,
            Integer grade,
            Integer classNumber,
            TimetableStatus status,
            List<TimetablePeriodResponseDTO> periods,
            String message
    ) {
        this.date = date;
        this.schoolName = schoolName;
        this.grade = grade;
        this.classNumber = classNumber;
        this.status = status;
        this.periods = periods;
        this.message = message;
    }

    public static TimetableDayResponseDTO ok(
            LocalDate date,
            String schoolName,
            Integer grade,
            Integer classNumber,
            List<TimetablePeriodResponseDTO> periods,
            String message
    ) {
        return new TimetableDayResponseDTO(
                date,
                schoolName,
                grade,
                classNumber,
                TimetableStatus.OK,
                periods,
                message
        );
    }

    public static TimetableDayResponseDTO noClasses(
            LocalDate date,
            String schoolName,
            Integer grade,
            Integer classNumber,
            String message
    ) {
        return new TimetableDayResponseDTO(
                date,
                schoolName,
                grade,
                classNumber,
                TimetableStatus.NO_CLASSES,
                List.of(),
                message
        );
    }

    public static TimetableDayResponseDTO profileIncomplete(LocalDate date, String schoolName, String message) {
        return new TimetableDayResponseDTO(
                date,
                schoolName,
                null,
                null,
                TimetableStatus.PROFILE_INCOMPLETE,
                List.of(),
                message
        );
    }

    public static TimetableDayResponseDTO mappingFailed(LocalDate date, String schoolName, String message) {
        return new TimetableDayResponseDTO(
                date,
                schoolName,
                null,
                null,
                TimetableStatus.MAPPING_FAILED,
                List.of(),
                message
        );
    }

    public static TimetableDayResponseDTO unavailable(LocalDate date, String schoolName, String message) {
        return new TimetableDayResponseDTO(
                date,
                schoolName,
                null,
                null,
                TimetableStatus.UNAVAILABLE,
                List.of(),
                message
        );
    }
}
