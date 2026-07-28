package com.ondo.domain.meal.controller;

import com.ondo.domain.meal.dto.MealDayResponseDTO;
import com.ondo.domain.meal.service.MealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/meals")
@RequiredArgsConstructor
public class MealController {

    private final MealService mealService;

    @GetMapping("/today")
    public ResponseEntity<MealDayResponseDTO> getTodayMeals(Authentication authentication) {
        return ResponseEntity.ok(mealService.getTodayMeals(authentication.getName()));
    }
}
