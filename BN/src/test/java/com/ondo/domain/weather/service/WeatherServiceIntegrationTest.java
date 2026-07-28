package com.ondo.domain.weather.service;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.weather.dev-mode=false"
})
@TestPropertySource(locations = "file:config/application-local.properties")
@Transactional
class WeatherServiceIntegrationTest {

    private static final String STUDENT_USERNAME = "it-weather-live-student";

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITWSL001")
                .schoolName("날씨실연중학교")
                .region("충청북도 음성군")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("실연학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getTodayWeather_returnsLiveDataForChungbukRegion() {
        WeatherTodayResponseDTO response = weatherService.getTodayWeather(STUDENT_USERNAME);

        assertThat(response.getRegion()).isEqualTo("충청북도 음성군");
        assertThat(response.getTemperature()).isNotBlank();
        assertThat(response.getCondition()).isNotEqualTo("정보 없음");
    }
}
