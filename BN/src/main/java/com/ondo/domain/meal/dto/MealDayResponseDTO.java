package com.ondo.domain.meal.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class MealDayResponseDTO {

    private final LocalDate date;
    private final String schoolName;
    private final MealDayStatus status;
    private final List<MealItemResponseDTO> meals;
    private final String message;

    public MealDayResponseDTO(
            LocalDate date,
            String schoolName,
            MealDayStatus status,
            List<MealItemResponseDTO> meals,
            String message
    ) {
        this.date = date;
        this.schoolName = schoolName;
        this.status = status;
        this.meals = meals;
        this.message = message;
    }

    public static MealDayResponseDTO ok(
            LocalDate date,
            String schoolName,
            List<MealItemResponseDTO> meals,
            String message
    ) {
        return new MealDayResponseDTO(date, schoolName, MealDayStatus.OK, meals, message);
    }

    public static MealDayResponseDTO noMeals(LocalDate date, String schoolName, String message) {
        return new MealDayResponseDTO(date, schoolName, MealDayStatus.NO_MEALS, List.of(), message);
    }

    public static MealDayResponseDTO mappingFailed(LocalDate date, String schoolName, String message) {
        return new MealDayResponseDTO(date, schoolName, MealDayStatus.MAPPING_FAILED, List.of(), message);
    }

    public static MealDayResponseDTO unavailable(LocalDate date, String schoolName, String message) {
        return new MealDayResponseDTO(date, schoolName, MealDayStatus.UNAVAILABLE, List.of(), message);
    }
}
