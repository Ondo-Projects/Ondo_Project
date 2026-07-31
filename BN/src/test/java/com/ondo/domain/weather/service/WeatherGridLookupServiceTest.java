package com.ondo.domain.weather.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
class WeatherGridLookupServiceTest {

    @Autowired
    private WeatherGridLookupService weatherGridLookupService;

    @Test
    void resolve_returnsExactDistrictCoordinate() {
        var coordinate = weatherGridLookupService.resolve("서울특별시 강남구");

        assertThat(coordinate.getNx()).isEqualTo(61);
        assertThat(coordinate.getNy()).isEqualTo(126);
    }

    @Test
    void resolve_fallsBackToSidoDefault() {
        var coordinate = weatherGridLookupService.resolve("경기도 안성시");

        assertThat(coordinate.getNx()).isEqualTo(60);
        assertThat(coordinate.getNy()).isEqualTo(120);
    }
}
