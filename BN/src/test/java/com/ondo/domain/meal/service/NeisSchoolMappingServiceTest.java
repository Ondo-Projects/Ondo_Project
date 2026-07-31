package com.ondo.domain.meal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.school.entity.School;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class NeisSchoolMappingServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void pickBestMatch_prefersExactNameAndSchoolType() throws Exception {
        String json = """
                [
                  {
                    "SCHUL_NM": "개포중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "7130166",
                    "ORG_RDNMA": "서울특별시 강남구 개포로"
                  },
                  {
                    "SCHUL_NM": "개포고등학교",
                    "SCHUL_KND_SC_NM": "고등학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "7130167",
                    "ORG_RDNMA": "서울특별시 강남구 개포로"
                  }
                ]
                """;

        School school = School.builder()
                .schoolCode("S010000699")
                .schoolName("개포중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        NeisSchoolCodeDTO matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.readTree(json),
                school
        ).orElseThrow();

        assertThat(matched.getOfficeCode()).isEqualTo("B10");
        assertThat(matched.getSchoolCode()).isEqualTo("7130166");
    }

    @Test
    void pickBestMatch_prefersRegionForHomonyms() throws Exception {
        String json = """
                [
                  {
                    "SCHUL_NM": "무극중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "C10",
                    "SD_SCHUL_CODE": "8000001",
                    "ORG_RDNMA": "충북 음성군 무극면",
                    "LCTN_SC_NM": "충청북도"
                  },
                  {
                    "SCHUL_NM": "무극중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "8000002",
                    "ORG_RDNMA": "경기도 포천시",
                    "LCTN_SC_NM": "경기도"
                  }
                ]
                """;

        School school = School.builder()
                .schoolCode("S110000618")
                .schoolName("무극중학교")
                .region("충청북도 음성군")
                .schoolType("중")
                .build();

        NeisSchoolCodeDTO matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.readTree(json),
                school
        ).orElseThrow();

        assertThat(matched.getOfficeCode()).isEqualTo("C10");
        assertThat(matched.getSchoolCode()).isEqualTo("8000001");
    }

    @Test
    void regionMatchScore_matchesAbbreviatedAddress() throws Exception {
        String json = """
                {
                  "ORG_RDNMA": "충북 음성군 무극면 학교길 1",
                  "LCTN_SC_NM": "충청북도"
                }
                """;

        int score = NeisSchoolMappingService.regionMatchScore(
                objectMapper.readTree(json),
                "충청북도 음성군"
        );

        assertThat(score).isGreaterThan(0);
    }

    @Test
    void pickBestMatch_emptyRows_returnsEmpty() throws Exception {
        Optional<NeisSchoolCodeDTO> matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.createArrayNode(),
                School.builder()
                        .schoolCode("S010000001")
                        .schoolName("테스트중학교")
                        .region("서울특별시")
                        .schoolType("중")
                        .build()
        );

        assertThat(matched).isEmpty();
    }

    @Test
    void pickBestMatch_noRegion_prefersSchoolType() throws Exception {
        String json = """
                [
                  {
                    "SCHUL_NM": "테스트중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "1111111",
                    "ORG_RDNMA": "서울특별시 강남구"
                  },
                  {
                    "SCHUL_NM": "테스트고등학교",
                    "SCHUL_KND_SC_NM": "고등학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "2222222",
                    "ORG_RDNMA": "서울특별시 강남구"
                  }
                ]
                """;

        School school = School.builder()
                .schoolCode("S010000002")
                .schoolName("테스트중학교")
                .schoolType("중")
                .build();

        NeisSchoolCodeDTO matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.readTree(json),
                school
        ).orElseThrow();

        assertThat(matched.getSchoolCode()).isEqualTo("1111111");
    }

    @Test
    void pickBestMatch_tieBreaksByRegionScore() throws Exception {
        String json = """
                [
                  {
                    "SCHUL_NM": "동명중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "C10",
                    "SD_SCHUL_CODE": "9000001",
                    "ORG_RDNMA": "충북 음성군",
                    "LCTN_SC_NM": "충청북도"
                  },
                  {
                    "SCHUL_NM": "동명중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "9000002",
                    "ORG_RDNMA": "경기도 수원시",
                    "LCTN_SC_NM": "경기도"
                  }
                ]
                """;

        School school = School.builder()
                .schoolCode("S110000001")
                .schoolName("동명중학교")
                .region("충청북도 음성군")
                .schoolType("중")
                .build();

        NeisSchoolCodeDTO matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.readTree(json),
                school
        ).orElseThrow();

        assertThat(matched.getOfficeCode()).isEqualTo("C10");
        assertThat(matched.getSchoolCode()).isEqualTo("9000001");
    }

    @Test
    void pickBestMatch_missingNeisCodes_returnsEmpty() throws Exception {
        String json = """
                [
                  {
                    "SCHUL_NM": "코드없음중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ORG_RDNMA": "서울특별시"
                  }
                ]
                """;

        Optional<NeisSchoolCodeDTO> matched = NeisSchoolMappingService.pickBestMatch(
                objectMapper.readTree(json),
                School.builder()
                        .schoolCode("S010000003")
                        .schoolName("코드없음중학교")
                        .region("서울특별시")
                        .schoolType("중")
                        .build()
        );

        assertThat(matched).isEmpty();
    }

    @Test
    void normalizeRegionText_mapsProvinceAlias() {
        assertThat(NeisSchoolMappingService.normalizeRegionText("충청북도 음성군"))
                .isEqualTo("충북음성군");
    }
}
