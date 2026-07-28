package com.ondo.domain.weather.service;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.weather.client.WeatherApiClient;
import com.ondo.domain.weather.dto.WeatherGridCoordinate;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import com.ondo.global.config.WeatherProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WeatherService {

    private final WeatherProperties weatherProperties;
    private final WeatherApiClient weatherApiClient;
    private final WeatherGridLookupService weatherGridLookupService;
    private final UserRepository userRepository;

    public WeatherTodayResponseDTO getTodayWeather(String username) {
        User student = getStudent(username);
        School school = student.getSchool();
        String region = weatherGridLookupService.requireRegionLabel(school.getRegion());

        if (weatherProperties.isDevMode()) {
            return sampleWeather(region);
        }

        WeatherGridCoordinate grid = weatherGridLookupService.resolve(region);
        return weatherApiClient.fetchTodayWeather(region, grid);
    }

    private WeatherTodayResponseDTO sampleWeather(String region) {
        return new WeatherTodayResponseDTO(
                region,
                "맑음",
                "☀️",
                "28°C",
                "22°C",
                "31°C",
                "개발 모드 샘플 날씨입니다."
        );
    }

    private User getStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("학생만 날씨 정보를 조회할 수 있습니다.");
        }
        return user;
    }
}
