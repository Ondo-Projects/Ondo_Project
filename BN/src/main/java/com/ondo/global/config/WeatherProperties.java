package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.weather")
public class WeatherProperties {

    private boolean devMode = false;
    private String apiKey = "";
    private String baseUrl = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
}
