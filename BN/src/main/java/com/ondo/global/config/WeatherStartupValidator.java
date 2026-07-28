package com.ondo.global.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class WeatherStartupValidator {

    private final WeatherProperties weatherProperties;

    @PostConstruct
    void validate() {
        if (weatherProperties.isDevMode()) {
            log.info("날씨 API는 개발 모드로 동작합니다.");
            return;
        }

        if (!StringUtils.hasText(weatherProperties.getApiKey())) {
            log.warn("기상청 API 키가 설정되지 않았습니다. BN/config/application-local.properties 를 확인하고 서버를 BN 폴더에서 실행해 주세요.");
            return;
        }

        log.info("기상청 API 키가 설정되었습니다.");
    }
}
