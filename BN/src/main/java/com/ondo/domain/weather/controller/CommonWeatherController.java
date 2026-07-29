package com.ondo.domain.weather.controller;

import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import com.ondo.domain.weather.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common/weather")
@RequiredArgsConstructor
public class CommonWeatherController {

    private final WeatherService weatherService;

    @GetMapping("/today")
    public ResponseEntity<WeatherTodayResponseDTO> getTodayWeather(Authentication authentication) {
        return ResponseEntity.ok(weatherService.getTodayWeatherForHome(authentication.getName()));
    }
}
