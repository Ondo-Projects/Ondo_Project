package com.ondo.domain.weather.service;

import com.ondo.domain.weather.dto.WeatherGridCoordinate;
import com.ondo.global.error.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WeatherGridLookupService {

    private final Map<String, WeatherGridCoordinate> exactMatches = new HashMap<>();
    private final Map<String, WeatherGridCoordinate> prefixDefaults = new HashMap<>();
    private WeatherGridCoordinate fallbackCoordinate;

    @PostConstruct
    void loadGridMap() {
        try {
            ClassPathResource resource = new ClassPathResource("data/weather/region-grid.csv");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean headerSkipped = false;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) {
                        continue;
                    }
                    if (!headerSkipped) {
                        headerSkipped = true;
                        continue;
                    }
                    String[] parts = line.split(",", -1);
                    if (parts.length < 3) {
                        continue;
                    }
                    String region = parts[0].trim();
                    int nx = Integer.parseInt(parts[1].trim());
                    int ny = Integer.parseInt(parts[2].trim());

                    if (region.startsWith("DEFAULT:")) {
                        String key = region.substring("DEFAULT:".length());
                        WeatherGridCoordinate coordinate = new WeatherGridCoordinate(nx, ny);
                        if ("DEFAULT".equals(key)) {
                            fallbackCoordinate = coordinate;
                        } else {
                            prefixDefaults.put(normalize(key), coordinate);
                        }
                    } else {
                        exactMatches.put(normalize(region), new WeatherGridCoordinate(nx, ny));
                    }
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException("날씨 격자 좌표 파일을 읽을 수 없습니다.", exception);
        }

        if (fallbackCoordinate == null) {
            fallbackCoordinate = new WeatherGridCoordinate(60, 127);
        }
        log.info("날씨 격자 좌표 {}건, 시도 기본값 {}건을 불러왔습니다.", exactMatches.size(), prefixDefaults.size());
    }

    public WeatherGridCoordinate resolve(String region) {
        if (region == null || region.isBlank()) {
            return fallbackCoordinate;
        }

        String normalizedRegion = normalize(region);
        WeatherGridCoordinate exact = exactMatches.get(normalizedRegion);
        if (exact != null) {
            return exact;
        }

        String district = extractDistrict(region);
        if (district != null) {
            WeatherGridCoordinate districtMatch = exactMatches.entrySet().stream()
                    .filter(entry -> entry.getKey().endsWith(district))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(null);
            if (districtMatch != null) {
                return districtMatch;
            }
        }

        for (Map.Entry<String, WeatherGridCoordinate> entry : prefixDefaults.entrySet()) {
            if (normalizedRegion.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }

        return fallbackCoordinate;
    }

    public String requireRegionLabel(String region) {
        if (region == null || region.isBlank()) {
            throw new BusinessException("학교 지역 정보가 없어 날씨를 조회할 수 없습니다.");
        }
        return region.trim();
    }

    private static String normalize(String value) {
        return value.replace(" ", "").trim();
    }

    private static String extractDistrict(String region) {
        String[] parts = region.trim().split("\\s+");
        return parts.length > 0 ? normalize(parts[parts.length - 1]) : null;
    }
}
