package com.ondo.domain.meal.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class MealDayResponseDTO {

    private final LocalDate date;
    private final String schoolName;
    private final List<MealItemResponseDTO> meals;
    private final String message;

    public MealDayResponseDTO(LocalDate date, String schoolName, List<MealItemResponseDTO> meals, String message) {
        this.date = date;
        this.schoolName = schoolName;
        this.meals = meals;
        this.message = message;
    }

    public static MealDayResponseDTO empty(LocalDate date, String schoolName, String message) {
        return new MealDayResponseDTO(date, schoolName, List.of(), message);
    }
}
