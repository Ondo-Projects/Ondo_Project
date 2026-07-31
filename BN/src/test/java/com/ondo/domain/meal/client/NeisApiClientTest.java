package com.ondo.domain.meal.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NeisApiClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractRowsFromNeisResponse_parsesSplitHeadAndRowContainers() throws Exception {
        String json = """
                {
                  "schoolInfo": [
                    {"head": [{"list_total_count": 1}, {"RESULT": {"CODE": "INFO-000", "MESSAGE": "정상"}}]},
                    {"row": [{"SCHUL_NM": "무극중학교", "ATPT_OFCDC_SC_CODE": "M10", "SD_SCHUL_CODE": "8101008"}]}
                  ]
                }
                """;

        var rows = NeisApiClient.extractRowsFromNeisResponse(objectMapper.readTree(json), "schoolInfo");

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).path("SCHUL_NM").asText()).isEqualTo("무극중학교");
    }

    @Test
    void extractRowsFromNeisResponse_handlesRootLevelInfo200() throws Exception {
        String json = """
                {"RESULT": {"CODE": "INFO-200", "MESSAGE": "해당하는 데이터가 없습니다."}}
                """;

        var rows = NeisApiClient.extractRowsFromNeisResponse(objectMapper.readTree(json), "mealServiceDietInfo");

        assertThat(rows).isEmpty();
    }

    @Test
    void formatMenu_convertsHtmlBreaksToBulletLines() {
        String formatted = NeisApiClient.formatMenu("현미밥<br/>미역국<br/>제육볶음");

        assertThat(formatted).isEqualTo("· 현미밥\n· 미역국\n· 제육볶음");
    }

    @Test
    void trimSchoolSuffix_removesSchoolSuffix() {
        assertThat(NeisApiClient.trimSchoolSuffix("무극중학교")).isEqualTo("무극중");
        assertThat(NeisApiClient.trimSchoolSuffix("개포고")).isEqualTo("개포고");
    }

    @Test
    void locationKeywords_includesProvinceAliasVariants() {
        assertThat(NeisApiClient.locationKeywords("충청북도 음성군"))
                .contains("충청북도", "충북", "음성군");
        assertThat(NeisApiClient.locationKeywords("충북 음성군"))
                .contains("충북", "충청북도", "음성군");
    }
}
