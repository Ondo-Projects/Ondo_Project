package com.ondo.domain.weather.dto;

import lombok.Getter;

@Getter
public class WeatherTodayResponseDTO {

    private final String region;
    private final String condition;
    private final String icon;
    private final String temperature;
    private final String minTemperature;
    private final String maxTemperature;
    private final String message;

    public WeatherTodayResponseDTO(
            String region,
            String condition,
            String icon,
            String temperature,
            String minTemperature,
            String maxTemperature,
            String message
    ) {
        this.region = region;
        this.condition = condition;
        this.icon = icon;
        this.temperature = temperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
        this.message = message;
    }
}
