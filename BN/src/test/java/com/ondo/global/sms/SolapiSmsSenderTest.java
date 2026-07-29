package com.ondo.global.sms;

import com.ondo.global.config.SolapiProperties;
import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SolapiSmsSenderTest {

    @Test
    void sendSms_devMode_doesNotRequireConfig() {
        SolapiProperties properties = new SolapiProperties();
        properties.setDevMode(true);

        SolapiSmsSender sender = new SolapiSmsSender(properties);

        assertDoesNotThrow(() -> sender.sendSms("01012345678", "테스트 메시지"));
    }

    @Test
    void sendSms_prodMode_requiresConfig() {
        SolapiProperties properties = new SolapiProperties();
        properties.setDevMode(false);

        SolapiSmsSender sender = new SolapiSmsSender(properties);

        assertThrows(BusinessException.class, () -> sender.sendSms("01012345678", "테스트 메시지"));
    }
}
