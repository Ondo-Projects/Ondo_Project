package com.ondo.domain.meal.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.meal.dto.MealItemResponseDTO;
import com.ondo.global.config.NeisProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NeisApiClient {

    private static final DateTimeFormatter NEIS_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Map<String, String> MEAL_TYPE_LABELS = Map.of(
            "1", "조식",
            "2", "중식",
            "3", "석식"
    );

    private static final Map<String, String> PROVINCE_ALIASES = Map.ofEntries(
            Map.entry("충청북도", "충북"),
            Map.entry("충청남도", "충남"),
            Map.entry("경상북도", "경북"),
            Map.entry("경상남도", "경남"),
            Map.entry("전라북도", "전북"),
            Map.entry("전라남도", "전남"),
            Map.entry("제주특별자치도", "제주"),
            Map.entry("세종특별자치시", "세종"),
            Map.entry("강원특별자치도", "강원"),
            Map.entry("전북특별자치도", "전북")
    );

    private final NeisProperties neisProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    public JsonNode searchSchoolRows(String schoolName) {
        return searchSchoolRows(schoolName, null);
    }

    public JsonNode searchSchoolRows(String schoolName, String locationName) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(neisProperties.getBaseUrl() + "/schoolInfo")
                .queryParam("KEY", requireApiKey())
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", 100)
                .queryParam("SCHUL_NM", schoolName);
        if (locationName != null && !locationName.isBlank()) {
            builder.queryParam("LCTN_SC_NM", locationName);
        }
        URI uri = builder.build().encode().toUri();
        return fetchRows(uri, "schoolInfo");
    }

    public JsonNode searchSchoolForMapping(com.ondo.domain.school.entity.School school) {
        com.fasterxml.jackson.databind.node.ArrayNode merged = objectMapper.createArrayNode();
        appendUniqueRows(merged, searchSchoolRows(school.getSchoolName()));

        String shortName = trimSchoolSuffix(school.getSchoolName());
        if (!shortName.equals(school.getSchoolName())) {
            appendUniqueRows(merged, searchSchoolRows(shortName));
        }

        String region = school.getRegion();
        if (region != null && !region.isBlank()) {
            for (String locationKeyword : locationKeywords(region)) {
                appendUniqueRows(merged, searchSchoolRows(school.getSchoolName(), locationKeyword));
                if (!shortName.equals(school.getSchoolName())) {
                    appendUniqueRows(merged, searchSchoolRows(shortName, locationKeyword));
                }
            }
        }
        return merged;
    }

    private void appendUniqueRows(com.fasterxml.jackson.databind.node.ArrayNode target, JsonNode rows) {
        if (rows == null || !rows.isArray()) {
            return;
        }
        for (JsonNode row : rows) {
            String key = textValue(row, "ATPT_OFCDC_SC_CODE") + ":" + textValue(row, "SD_SCHUL_CODE");
            boolean exists = false;
            for (JsonNode existing : target) {
                String existingKey = textValue(existing, "ATPT_OFCDC_SC_CODE") + ":" + textValue(existing, "SD_SCHUL_CODE");
                if (key.equals(existingKey)) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                target.add(row);
            }
        }
    }

    static String trimSchoolSuffix(String schoolName) {
        if (schoolName == null) {
            return "";
        }
        String trimmed = schoolName.trim();
        if (trimmed.endsWith("학교")) {
            return trimmed.substring(0, trimmed.length() - 2);
        }
        return trimmed;
    }

    static java.util.List<String> locationKeywords(String region) {
        java.util.LinkedHashSet<String> keywords = new java.util.LinkedHashSet<>();
        String trimmed = region.trim();
        if (!trimmed.isBlank()) {
            keywords.add(trimmed);
        }
        String[] parts = trimmed.split("\\s+");
        if (parts.length > 0) {
            keywords.add(parts[0]);
            addProvinceKeywordVariants(keywords, parts[0]);
        }
        if (parts.length > 1) {
            keywords.add(parts[parts.length - 1]);
        }
        return java.util.List.copyOf(keywords);
    }

    private static void addProvinceKeywordVariants(java.util.Set<String> keywords, String province) {
        String alias = PROVINCE_ALIASES.get(province);
        if (alias != null) {
            keywords.add(alias);
        }
        for (Map.Entry<String, String> entry : PROVINCE_ALIASES.entrySet()) {
            if (entry.getValue().equals(province)) {
                keywords.add(entry.getKey());
            }
        }
    }

    public List<MealItemResponseDTO> fetchMeals(String officeCode, String standardSchoolCode, LocalDate date) {
        URI uri = UriComponentsBuilder
                .fromUriString(neisProperties.getBaseUrl() + "/mealServiceDietInfo")
                .queryParam("KEY", requireApiKey())
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", 100)
                .queryParam("ATPT_OFCDC_SC_CODE", officeCode)
                .queryParam("SD_SCHUL_CODE", standardSchoolCode)
                .queryParam("MLSV_YMD", NEIS_DATE.format(date))
                .build()
                .encode()
                .toUri();

        JsonNode rows = fetchRows(uri, "mealServiceDietInfo");
        List<MealItemResponseDTO> meals = new ArrayList<>();
        for (JsonNode row : rows) {
            String mealCode = textValue(row, "MMEAL_SC_CODE");
            String mealType = MEAL_TYPE_LABELS.getOrDefault(mealCode, textValue(row, "MMEAL_SC_NM"));
            if (mealType == null || mealType.isBlank()) {
                continue;
            }
            meals.add(new MealItemResponseDTO(
                    mealType,
                    parseMealOrder(mealCode),
                    formatMenu(textValue(row, "DDISH_NM")),
                    textValue(row, "CAL_INFO")
            ));
        }
        meals.sort(Comparator.comparingInt(MealItemResponseDTO::getMealOrder));
        return meals;
    }

    private JsonNode fetchRows(URI uri, String rootKey) {
        try {
            String body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            if (body == null || body.isBlank()) {
                return objectMapper.createArrayNode();
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode container = root.path(rootKey);
            if (!container.isArray() || container.isEmpty()) {
                return objectMapper.createArrayNode();
            }

            JsonNode first = container.get(0);
            assertSuccess(first.path("head"));

            JsonNode rowNode = first.path("row");
            if (rowNode.isMissingNode() || rowNode.isNull()) {
                return objectMapper.createArrayNode();
            }
            if (rowNode.isArray()) {
                return rowNode;
            }
            return objectMapper.createArrayNode().add(rowNode);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("NEIS API 호출에 실패했습니다.");
        }
    }

    private void assertSuccess(JsonNode headNode) {
        if (!headNode.isArray() || headNode.isEmpty()) {
            return;
        }
        JsonNode result = headNode.get(0).path("RESULT");
        if (result.isMissingNode()) {
            return;
        }
        String code = textValue(result, "CODE");
        if (code == null || code.startsWith("INFO-000") || code.startsWith("INFO-200")) {
            return;
        }
        String message = textValue(result, "MESSAGE");
        throw new BusinessException(message != null ? message : "NEIS API 오류가 발생했습니다.");
    }

    private String requireApiKey() {
        if (neisProperties.getApiKey() == null || neisProperties.getApiKey().isBlank()) {
            throw new BusinessException("NEIS API 키가 설정되지 않았습니다.");
        }
        return neisProperties.getApiKey();
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text.isBlank() ? null : text.trim();
    }

    private int parseMealOrder(String mealCode) {
        try {
            return Integer.parseInt(mealCode);
        } catch (NumberFormatException exception) {
            return 99;
        }
    }

    static String formatMenu(String rawMenu) {
        if (rawMenu == null || rawMenu.isBlank()) {
            return "";
        }
        String normalized = rawMenu
                .replace("<br/>", "\n")
                .replace("<br>", "\n")
                .replace("  ", " ")
                .trim();
        StringBuilder builder = new StringBuilder();
        for (Iterator<String> iterator = normalized.lines().iterator(); iterator.hasNext(); ) {
            String line = iterator.next().trim();
            if (line.isEmpty()) {
                continue;
            }
            builder.append("· ").append(line);
            if (iterator.hasNext()) {
                builder.append('\n');
            }
        }
        return builder.toString();
    }
}
