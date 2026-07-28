package com.ondo.domain.weather.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.weather.dto.WeatherGridCoordinate;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import com.ondo.global.config.WeatherProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WeatherApiClient {

    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter BASIC_TIME = DateTimeFormatter.ofPattern("HHmm");
    private static final int[] VILAGE_BASE_HOURS = {2, 5, 8, 11, 14, 17, 20, 23};

    private final WeatherProperties weatherProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    public WeatherTodayResponseDTO fetchTodayWeather(String region, WeatherGridCoordinate grid) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, String> current = fetchUltraShortNowcastSafely(grid, now);
        Map<String, List<ForecastValue>> vilageForecasts = fetchVilageForecast(grid, now);

        String temperature = formatTemperature(current.get("T1H"));
        ForecastSnapshot snapshot = buildSnapshot(vilageForecasts, now.toLocalDate(), current);

        if (temperature == null) {
            temperature = formatTemperature(snapshot.nearestTemperature());
        }

        if (temperature == null && snapshot.condition() == null) {
            throw new BusinessException("날씨 정보를 불러올 수 없습니다.");
        }

        return new WeatherTodayResponseDTO(
                region,
                snapshot.condition() != null ? snapshot.condition() : "정보 없음",
                snapshot.icon() != null ? snapshot.icon() : "🌡️",
                temperature != null ? temperature : "-",
                formatTemperature(snapshot.minTemperature()),
                formatTemperature(snapshot.maxTemperature()),
                null
        );
    }

    private Map<String, String> fetchUltraShortNowcast(WeatherGridCoordinate grid, LocalDateTime now) {
        LocalDateTime baseDateTime = resolveUltraBaseDateTime(now);
        URI uri = UriComponentsBuilder
                .fromUriString(weatherProperties.getBaseUrl() + "/getUltraSrtNcst")
                .queryParam("serviceKey", requireApiKey())
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000)
                .queryParam("dataType", "JSON")
                .queryParam("base_date", BASIC_DATE.format(baseDateTime.toLocalDate()))
                .queryParam("base_time", BASIC_TIME.format(baseDateTime))
                .queryParam("nx", grid.getNx())
                .queryParam("ny", grid.getNy())
                .build()
                .encode()
                .toUri();

        JsonNode items = fetchItems(uri);
        Map<String, String> values = new HashMap<>();
        for (JsonNode item : items) {
            values.put(text(item, "category"), text(item, "obsrValue"));
        }
        return values;
    }

    private Map<String, String> fetchUltraShortNowcastSafely(WeatherGridCoordinate grid, LocalDateTime now) {
        try {
            return fetchUltraShortNowcast(grid, now);
        } catch (BusinessException exception) {
            log.warn("초단기실황 조회에 실패해 단기예보 데이터만 사용합니다: {}", exception.getMessage());
            return Map.of();
        }
    }

    private Map<String, List<ForecastValue>> fetchVilageForecast(WeatherGridCoordinate grid, LocalDateTime now) {
        LocalDateTime baseDateTime = resolveVilageBaseDateTime(now);
        URI uri = UriComponentsBuilder
                .fromUriString(weatherProperties.getBaseUrl() + "/getVilageFcst")
                .queryParam("serviceKey", requireApiKey())
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000)
                .queryParam("dataType", "JSON")
                .queryParam("base_date", BASIC_DATE.format(baseDateTime.toLocalDate()))
                .queryParam("base_time", BASIC_TIME.format(baseDateTime))
                .queryParam("nx", grid.getNx())
                .queryParam("ny", grid.getNy())
                .build()
                .encode()
                .toUri();

        JsonNode items = fetchItems(uri);
        Map<String, List<ForecastValue>> grouped = new HashMap<>();
        for (JsonNode item : items) {
            String category = text(item, "category");
            if (category == null) {
                continue;
            }
            grouped.computeIfAbsent(category, key -> new ArrayList<>())
                    .add(new ForecastValue(
                            text(item, "fcstDate"),
                            text(item, "fcstTime"),
                            text(item, "fcstValue")
                    ));
        }
        return grouped;
    }

    private JsonNode fetchItems(URI uri) {
        try {
            String body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);
            if (body == null || body.isBlank()) {
                return objectMapper.createArrayNode();
            }

            JsonNode root = objectMapper.readTree(body);
            assertSuccess(root.path("response").path("header"));

            JsonNode items = root.path("response").path("body").path("items").path("item");
            if (items.isMissingNode() || items.isNull()) {
                return objectMapper.createArrayNode();
            }
            if (items.isArray()) {
                return items;
            }
            return objectMapper.createArrayNode().add(items);
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            log.warn("기상청 API HTTP {} 응답: {}", exception.getStatusCode().value(), exception.getResponseBodyAsString());
            throw new BusinessException("기상청 API 호출에 실패했습니다.");
        } catch (Exception exception) {
            log.warn("기상청 API 호출 중 오류", exception);
            throw new BusinessException("기상청 API 호출에 실패했습니다.");
        }
    }

    private void assertSuccess(JsonNode header) {
        String resultCode = text(header, "resultCode");
        if (resultCode == null || "00".equals(resultCode)) {
            return;
        }
        String message = text(header, "resultMsg");
        throw new BusinessException(message != null ? message : "기상청 API 오류가 발생했습니다.");
    }

    private ForecastSnapshot buildSnapshot(
            Map<String, List<ForecastValue>> forecasts,
            LocalDate targetDate,
            Map<String, String> current
    ) {
        String targetDateText = BASIC_DATE.format(targetDate);
        List<ForecastValue> tmpValues = filterByDate(forecasts.get("TMP"), targetDateText);
        List<ForecastValue> skyValues = filterByDate(forecasts.get("SKY"), targetDateText);
        List<ForecastValue> ptyValues = filterByDate(forecasts.get("PTY"), targetDateText);

        Integer minTemp = tmpValues.stream()
                .map(ForecastValue::intValue)
                .filter(value -> value != null)
                .min(Integer::compareTo)
                .orElse(null);
        Integer maxTemp = tmpValues.stream()
                .map(ForecastValue::intValue)
                .filter(value -> value != null)
                .max(Integer::compareTo)
                .orElse(null);

        String pty = current.get("PTY");
        if (pty == null && !ptyValues.isEmpty()) {
            pty = ptyValues.get(ptyValues.size() - 1).value();
        }

        String sky = null;
        if (!skyValues.isEmpty()) {
            sky = skyValues.get(skyValues.size() - 1).value();
        }

        ConditionInfo conditionInfo = resolveCondition(sky, pty);
        String nearestTemperature = tmpValues.isEmpty() ? null : tmpValues.get(tmpValues.size() - 1).value();

        return new ForecastSnapshot(
                conditionInfo.label(),
                conditionInfo.icon(),
                minTemp != null ? String.valueOf(minTemp) : null,
                maxTemp != null ? String.valueOf(maxTemp) : null,
                nearestTemperature
        );
    }

    private List<ForecastValue> filterByDate(List<ForecastValue> values, String targetDateText) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(value -> targetDateText.equals(value.date()))
                .sorted(Comparator.comparing(ForecastValue::time))
                .toList();
    }

    static ConditionInfo resolveCondition(String sky, String pty) {
        if ("1".equals(pty)) {
            return new ConditionInfo("비", "🌧️");
        }
        if ("2".equals(pty)) {
            return new ConditionInfo("비/눈", "🌨️");
        }
        if ("3".equals(pty)) {
            return new ConditionInfo("눈", "❄️");
        }
        if ("5".equals(pty)) {
            return new ConditionInfo("빗방울", "🌦️");
        }
        if ("6".equals(pty)) {
            return new ConditionInfo("빗방울/눈날림", "🌨️");
        }
        if ("7".equals(pty)) {
            return new ConditionInfo("눈날림", "❄️");
        }

        return switch (sky) {
            case "1" -> new ConditionInfo("맑음", "☀️");
            case "3" -> new ConditionInfo("구름많음", "⛅");
            case "4" -> new ConditionInfo("흐림", "☁️");
            default -> new ConditionInfo("정보 없음", "🌡️");
        };
    }

    private LocalDateTime resolveUltraBaseDateTime(LocalDateTime now) {
        LocalDateTime base = now.withMinute(0).withSecond(0).withNano(0);
        if (now.getMinute() < 40) {
            base = base.minusHours(1);
        }
        return base;
    }

    private LocalDateTime resolveVilageBaseDateTime(LocalDateTime now) {
        int currentHour = now.getHour();
        int selectedHour = VILAGE_BASE_HOURS[0];
        for (int hour : VILAGE_BASE_HOURS) {
            if (hour <= currentHour) {
                selectedHour = hour;
            }
        }
        LocalDateTime base = now.withHour(selectedHour).withMinute(0).withSecond(0).withNano(0);
        if (currentHour < VILAGE_BASE_HOURS[0]) {
            base = base.minusDays(1).withHour(VILAGE_BASE_HOURS[VILAGE_BASE_HOURS.length - 1]);
        }
        return base;
    }

    private String requireApiKey() {
        if (weatherProperties.getApiKey() == null || weatherProperties.getApiKey().isBlank()) {
            throw new BusinessException("기상청 API 키가 설정되지 않았습니다.");
        }
        return weatherProperties.getApiKey();
    }

    private String formatTemperature(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim() + "°C";
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private record ForecastValue(String date, String time, String value) {
        Integer intValue() {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException exception) {
                return null;
            }
        }
    }

    private record ForecastSnapshot(
            String condition,
            String icon,
            String minTemperature,
            String maxTemperature,
            String nearestTemperature
    ) {
    }

    record ConditionInfo(String label, String icon) {
    }
}
