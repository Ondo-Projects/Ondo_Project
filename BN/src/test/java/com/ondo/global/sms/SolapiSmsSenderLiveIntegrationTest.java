package com.ondo.global.sms;

import com.ondo.global.config.SolapiProperties;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.solapi.dev-mode=false"
})
class SolapiSmsSenderLiveIntegrationTest {

    @Autowired
    private SolapiProperties solapiProperties;

    @Autowired
    private SolapiSmsSender solapiSmsSender;

    @Test
    void sendSms_live_whenLocalSecretsConfigured() {
        Assumptions.assumeFalse(solapiProperties.getApiKey().isBlank(), "Solapi API key not configured");
        Assumptions.assumeFalse(solapiProperties.getApiSecret().isBlank(), "Solapi API secret not configured");
        Assumptions.assumeFalse(solapiProperties.getSenderPhone().isBlank(), "Solapi sender phone not configured");

        String recipient = solapiProperties.getSenderPhone();

        assertDoesNotThrow(() -> solapiSmsSender.sendSms(
                recipient,
                """
                [온도 상담웹] Solapi live integration test
                이 메시지는 로컬 실발송 확인용입니다.
                """
        ));
    }
}
