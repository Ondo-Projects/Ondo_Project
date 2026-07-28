package com.ondo.domain.meal.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NeisApiClientTest {

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
