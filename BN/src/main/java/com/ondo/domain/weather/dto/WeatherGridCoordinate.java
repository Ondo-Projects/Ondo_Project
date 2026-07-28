package com.ondo.domain.weather.dto;

import lombok.Getter;

@Getter
public class WeatherGridCoordinate {

    private final int nx;
    private final int ny;

    public WeatherGridCoordinate(int nx, int ny) {
        this.nx = nx;
        this.ny = ny;
    }
}
