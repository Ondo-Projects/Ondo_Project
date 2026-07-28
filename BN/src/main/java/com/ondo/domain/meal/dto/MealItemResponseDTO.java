package com.ondo.domain.meal.dto;

import lombok.Getter;

@Getter
public class MealItemResponseDTO {

    private final String mealType;
    private final int mealOrder;
    private final String menu;
    private final String calories;

    public MealItemResponseDTO(String mealType, int mealOrder, String menu, String calories) {
        this.mealType = mealType;
        this.mealOrder = mealOrder;
        this.menu = menu;
        this.calories = calories;
    }
}
