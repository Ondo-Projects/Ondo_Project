package com.ondo.domain.meal.client;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NeisApiClientTest {

    @Test
    void formatMenu_convertsHtmlBreaksToBulletLines() {
        String formatted = NeisApiClient.formatMenu("현미밥<br/>미역국<br/>제육볶음");

        assertThat(formatted).isEqualTo("· 현미밥\n· 미역국\n· 제육볶음");
    }
}
