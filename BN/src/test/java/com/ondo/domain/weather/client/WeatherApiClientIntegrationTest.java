package com.ondo.domain.weather.client;

import com.ondo.domain.weather.dto.WeatherGridCoordinate;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.weather.dev-mode=false"
})
@TestPropertySource(locations = "file:config/application-local.properties")
class WeatherApiClientIntegrationTest {

    @Autowired
    private WeatherApiClient weatherApiClient;

    @Test
    void fetchTodayWeather_returnsLiveData() {
        WeatherTodayResponseDTO response = weatherApiClient.fetchTodayWeather(
                "서울특별시 강남구",
                new WeatherGridCoordinate(61, 126)
        );

        assertThat(response.getTemperature()).isNotBlank();
        assertThat(response.getCondition()).isNotEqualTo("정보 없음");
    }
}
