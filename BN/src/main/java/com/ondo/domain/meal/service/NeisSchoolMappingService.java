package com.ondo.domain.meal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.NeisMappingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NeisSchoolMappingService {

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

    private final NeisApiClient neisApiClient;
    private final SchoolRepository schoolRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NeisSchoolCodeDTO resolveNeisCodes(School school) {
        if (school.hasNeisCodes()) {
            return new NeisSchoolCodeDTO(school.getNeisOfficeCode(), school.getNeisSchoolCode());
        }

        JsonNode rows = neisApiClient.searchSchoolForMapping(school);
        int candidateCount = countRows(rows);
        Optional<NeisSchoolCodeDTO> matchedOptional = pickBestMatch(rows, school);

        if (matchedOptional.isEmpty()) {
            log.warn(
                    "NEIS 학교 코드 매핑 실패: schoolCode={}, schoolName={}, region={}, schoolType={}, candidateCount={}",
                    school.getSchoolCode(),
                    school.getSchoolName(),
                    school.getRegion(),
                    school.getSchoolType(),
                    candidateCount
            );
            throw new NeisMappingException(
                    "NEIS에서 학교 코드를 찾을 수 없습니다. 학교명: " + school.getSchoolName());
        }

        NeisSchoolCodeDTO matched = matchedOptional.get();

        School managedSchool = schoolRepository.findById(school.getSchoolCode())
                .orElseThrow(() -> new BusinessException("학교 정보를 찾을 수 없습니다."));
        managedSchool.updateNeisCodes(matched.getOfficeCode(), matched.getSchoolCode());

        log.debug(
                "NEIS 학교 코드 매핑 성공: schoolCode={}, schoolName={}, officeCode={}, neisSchoolCode={}",
                school.getSchoolCode(),
                school.getSchoolName(),
                matched.getOfficeCode(),
                matched.getSchoolCode()
        );
        return matched;
    }

    private static int countRows(JsonNode rows) {
        if (rows == null || !rows.isArray()) {
            return 0;
        }
        return rows.size();
    }

    static Optional<NeisSchoolCodeDTO> pickBestMatch(JsonNode rows, School school) {
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            return Optional.empty();
        }

        List<JsonNode> candidates = new ArrayList<>();
        for (JsonNode row : rows) {
            candidates.add(row);
        }

        List<JsonNode> exactNameMatches = candidates.stream()
                .filter(row -> school.getSchoolName().equals(text(row, "SCHUL_NM")))
                .toList();
        if (!exactNameMatches.isEmpty()) {
            candidates = new ArrayList<>(exactNameMatches);
        }

        List<JsonNode> kindMatches = candidates.stream()
                .filter(row -> matchesSchoolType(row, school.getSchoolType()))
                .toList();
        if (!kindMatches.isEmpty()) {
            candidates = new ArrayList<>(kindMatches);
        }

        if (school.getRegion() != null && !school.getRegion().isBlank()) {
            List<JsonNode> regionMatches = candidates.stream()
                    .filter(row -> regionMatchScore(row, school.getRegion()) > 0)
                    .toList();
            if (!regionMatches.isEmpty()) {
                candidates = new ArrayList<>(regionMatches);
            }
        }

        JsonNode selected = candidates.stream()
                .max(candidateComparator(school))
                .orElse(candidates.getFirst());

        String officeCode = text(selected, "ATPT_OFCDC_SC_CODE");
        String standardCode = text(selected, "SD_SCHUL_CODE");
        if (officeCode == null || standardCode == null) {
            return Optional.empty();
        }
        return Optional.of(new NeisSchoolCodeDTO(officeCode, standardCode));
    }

    private static int scoreCandidate(JsonNode row, School school) {
        int score = 0;
        if (school.getSchoolName().equals(text(row, "SCHUL_NM"))) {
            score += 100;
        }
        if (matchesSchoolType(row, school.getSchoolType())) {
            score += 50;
        }
        if (school.getRegion() != null && !school.getRegion().isBlank()) {
            score += regionMatchScore(row, school.getRegion());
        }
        return score;
    }

    private static boolean matchesSchoolType(JsonNode row, String schoolType) {
        String kindName = text(row, "SCHUL_KND_SC_NM");
        if (kindName == null || schoolType == null) {
            return true;
        }
        return switch (schoolType) {
            case "중" -> kindName.contains("중학교");
            case "고" -> kindName.contains("고등학교");
            default -> true;
        };
    }

    private static Comparator<JsonNode> candidateComparator(School school) {
        String region = school.getRegion() != null ? school.getRegion() : "";
        return Comparator
                .comparingInt((JsonNode row) -> scoreCandidate(row, school))
                .thenComparingInt(row -> regionMatchScore(row, region))
                .thenComparing(row -> text(row, "SD_SCHUL_CODE"), Comparator.nullsLast(String::compareTo));
    }

    static int regionMatchScore(JsonNode row, String region) {
        String normalizedRegion = normalizeRegionText(region);
        String address = normalizeRegionText(text(row, "ORG_RDNMA"));
        String location = normalizeRegionText(text(row, "LCTN_SC_NM"));

        int score = 0;
        String district = normalizeRegionText(extractDistrictKeyword(region));
        String province = normalizeRegionText(extractProvince(region));

        if (!district.isBlank() && address.contains(district)) {
            score += 30;
        }
        if (!province.isBlank() && address.contains(province)) {
            score += 20;
        }
        if (!location.isBlank()) {
            if (normalizedRegion.contains(location) || location.contains(province)) {
                score += 25;
            }
            if (!province.isBlank() && location.contains(province)) {
                score += 15;
            }
        }
        if (!normalizedRegion.isBlank() && address.contains(normalizedRegion)) {
            score += 15;
        }
        return score;
    }

    static String normalizeRegionText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String normalized = text.replace(" ", "");
        for (Map.Entry<String, String> entry : PROVINCE_ALIASES.entrySet()) {
            normalized = normalized.replace(entry.getKey(), entry.getValue());
        }
        return normalized;
    }

    static String extractProvince(String region) {
        String[] parts = region.trim().split("\\s+");
        return parts.length > 0 ? parts[0] : region.trim();
    }

    static String extractDistrictKeyword(String region) {
        String[] parts = region.trim().split("\\s+");
        return parts.length > 0 ? parts[parts.length - 1] : region.trim();
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }
}
