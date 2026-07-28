package com.ondo.domain.weather.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WeatherApiClientTest {

    @Test
    void resolveCondition_returnsRainWhenPrecipitationExists() {
        WeatherApiClient.ConditionInfo info = WeatherApiClient.resolveCondition("1", "1");

        assertThat(info.label()).isEqualTo("비");
        assertThat(info.icon()).isEqualTo("🌧️");
    }

    @Test
    void resolveCondition_returnsSkyWhenNoPrecipitation() {
        WeatherApiClient.ConditionInfo info = WeatherApiClient.resolveCondition("3", "0");

        assertThat(info.label()).isEqualTo("구름많음");
        assertThat(info.icon()).isEqualTo("⛅");
    }
}
