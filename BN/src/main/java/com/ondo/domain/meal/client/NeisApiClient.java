package com.ondo.domain.meal.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.ondo.domain.meal.dto.MealItemResponseDTO;
import com.ondo.domain.schoollife.dto.SchoolScheduleItemResponseDTO;
import com.ondo.domain.schoollife.dto.TimetablePeriodResponseDTO;
import com.ondo.global.cache.CacheNames;
import com.ondo.global.config.NeisProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NeisApiClient {

    private static final JsonNodeFactory NODE_FACTORY = JsonNodeFactory.instance;

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
        URI uri = buildEncodedUri(builder);
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

    @Cacheable(
            cacheNames = CacheNames.NEIS_MEALS,
            key = "#officeCode + ':' + #standardSchoolCode + ':' + #date"
    )
    public List<MealItemResponseDTO> fetchMeals(String officeCode, String standardSchoolCode, LocalDate date) {
        URI uri = buildEncodedUri(UriComponentsBuilder
                .fromUriString(neisProperties.getBaseUrl() + "/mealServiceDietInfo")
                .queryParam("KEY", requireApiKey())
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", 100)
                .queryParam("ATPT_OFCDC_SC_CODE", officeCode)
                .queryParam("SD_SCHUL_CODE", standardSchoolCode)
                .queryParam("MLSV_YMD", NEIS_DATE.format(date)));

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

    @Cacheable(
            cacheNames = CacheNames.NEIS_SCHEDULE,
            key = "#officeCode + ':' + #standardSchoolCode + ':' + #fromDate + ':' + #toDate"
    )
    public List<SchoolScheduleItemResponseDTO> fetchSchoolSchedule(
            String officeCode,
            String standardSchoolCode,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        URI uri = buildEncodedUri(UriComponentsBuilder
                .fromUriString(neisProperties.getBaseUrl() + "/SchoolSchedule")
                .queryParam("KEY", requireApiKey())
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", 100)
                .queryParam("ATPT_OFCDC_SC_CODE", officeCode)
                .queryParam("SD_SCHUL_CODE", standardSchoolCode)
                .queryParam("AA_FROM_YMD", NEIS_DATE.format(fromDate))
                .queryParam("AA_TO_YMD", NEIS_DATE.format(toDate)));

        JsonNode rows = fetchRows(uri, "SchoolSchedule");
        Map<LocalDate, SchoolScheduleItemResponseDTO> eventsByDate = new LinkedHashMap<>();
        for (JsonNode row : rows) {
            LocalDate eventDate = parseNeisDate(textValue(row, "AA_YMD"));
            if (eventDate == null) {
                continue;
            }
            if (eventDate.isBefore(fromDate) || eventDate.isAfter(toDate)) {
                continue;
            }
            String eventName = textValue(row, "EVENT_NM");
            if (eventName == null || eventName.isBlank()) {
                continue;
            }
            String eventContent = textValue(row, "EVENT_CNTNT");
            eventsByDate.putIfAbsent(
                    eventDate,
                    new SchoolScheduleItemResponseDTO(eventDate, eventName, eventContent)
            );
        }

        return eventsByDate.values().stream()
                .sorted(Comparator.comparing(SchoolScheduleItemResponseDTO::getDate))
                .toList();
    }

    @Cacheable(
            cacheNames = CacheNames.NEIS_TIMETABLE,
            key = "#officeCode + ':' + #standardSchoolCode + ':' + #schoolType + ':' + #date + ':' + #grade + ':' + #classNumber"
    )
    public List<TimetablePeriodResponseDTO> fetchTimetable(
            String officeCode,
            String standardSchoolCode,
            String schoolType,
            LocalDate date,
            int grade,
            int classNumber
    ) {
        String rootKey = resolveTimetableRootKey(schoolType);
        URI uri = buildEncodedUri(UriComponentsBuilder
                .fromUriString(neisProperties.getBaseUrl() + "/" + rootKey)
                .queryParam("KEY", requireApiKey())
                .queryParam("Type", "json")
                .queryParam("pIndex", 1)
                .queryParam("pSize", 100)
                .queryParam("ATPT_OFCDC_SC_CODE", officeCode)
                .queryParam("SD_SCHUL_CODE", standardSchoolCode)
                .queryParam("ALL_TI_YMD", NEIS_DATE.format(date))
                .queryParam("GRADE", String.valueOf(grade))
                .queryParam("CLASS_NM", String.valueOf(classNumber)));

        JsonNode rows = fetchRows(uri, rootKey);
        Map<Integer, TimetablePeriodResponseDTO> periodsByNumber = new LinkedHashMap<>();
        for (JsonNode row : rows) {
            LocalDate timetableDate = parseNeisDate(textValue(row, "ALL_TI_YMD"));
            if (timetableDate != null && !timetableDate.equals(date)) {
                continue;
            }
            Integer period = parsePeriod(textValue(row, "PERIO"));
            if (period == null) {
                continue;
            }
            String subject = textValue(row, "ITRT_CNTNT");
            if (subject == null || subject.isBlank()) {
                continue;
            }
            String classroom = textValue(row, "CLRM_NM");
            periodsByNumber.putIfAbsent(period, new TimetablePeriodResponseDTO(period, subject, classroom));
        }

        return periodsByNumber.values().stream()
                .sorted(Comparator.comparingInt(TimetablePeriodResponseDTO::getPeriod))
                .toList();
    }

    private String resolveTimetableRootKey(String schoolType) {
        if ("고".equals(schoolType)) {
            return "hisTimetable";
        }
        if ("중".equals(schoolType)) {
            return "misTimetable";
        }
        return "misTimetable";
    }

    private Integer parsePeriod(String rawPeriod) {
        if (rawPeriod == null || rawPeriod.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(rawPeriod.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDate parseNeisDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(rawDate.trim(), NEIS_DATE);
        } catch (Exception exception) {
            return null;
        }
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
            return extractRowsFromNeisResponse(root, rootKey);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("NEIS API 호출에 실패했습니다.");
        }
    }

    static JsonNode extractRowsFromNeisResponse(JsonNode root, String rootKey) {
        JsonNode container = root.path(rootKey);
        if (!container.isArray() || container.isEmpty()) {
            assertSuccess(root.path("RESULT"));
            return NODE_FACTORY.arrayNode();
        }

        JsonNode headNode = null;
        JsonNode rowNode = null;
        for (JsonNode item : container) {
            if (item.has("head")) {
                headNode = item.path("head");
            }
            if (item.has("row")) {
                rowNode = item.path("row");
            }
        }

        assertSuccess(headNode);
        assertSuccess(root.path("RESULT"));

        if (rowNode == null || rowNode.isMissingNode() || rowNode.isNull()) {
            return NODE_FACTORY.arrayNode();
        }
        if (rowNode.isArray()) {
            return rowNode;
        }
        ArrayNode singleRow = NODE_FACTORY.arrayNode();
        singleRow.add(rowNode);
        return singleRow;
    }

    private static void assertSuccess(JsonNode headOrResultNode) {
        if (headOrResultNode == null || headOrResultNode.isMissingNode() || headOrResultNode.isNull()) {
            return;
        }

        if (headOrResultNode.has("CODE")) {
            assertSuccessCode(textValue(headOrResultNode, "CODE"), textValue(headOrResultNode, "MESSAGE"));
            return;
        }

        if (!headOrResultNode.isArray()) {
            return;
        }

        for (JsonNode item : headOrResultNode) {
            JsonNode result = item.path("RESULT");
            if (!result.isMissingNode()) {
                assertSuccessCode(textValue(result, "CODE"), textValue(result, "MESSAGE"));
            }
        }
    }

    private static void assertSuccessCode(String code, String message) {
        if (code == null || code.startsWith("INFO-000") || code.startsWith("INFO-200")) {
            return;
        }
        throw new BusinessException(message != null ? message : "NEIS API 오류가 발생했습니다.");
    }

    private URI buildEncodedUri(UriComponentsBuilder builder) {
        var components = builder.build();
        StringBuilder query = new StringBuilder();
        components.getQueryParams().forEach((name, values) -> {
            for (String value : values) {
                if (!query.isEmpty()) {
                    query.append('&');
                }
                query.append(UriUtils.encodeQueryParam(name, StandardCharsets.UTF_8));
                query.append('=');
                query.append(UriUtils.encodeQueryParam(value != null ? value : "", StandardCharsets.UTF_8));
            }
        });
        String base = components.toUriString().split("\\?", 2)[0];
        return URI.create(base + "?" + query);
    }

    private String requireApiKey() {
        if (neisProperties.getApiKey() == null || neisProperties.getApiKey().isBlank()) {
            throw new BusinessException("NEIS API 키가 설정되지 않았습니다.");
        }
        return neisProperties.getApiKey();
    }

    private static String textValue(JsonNode node, String fieldName) {
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
