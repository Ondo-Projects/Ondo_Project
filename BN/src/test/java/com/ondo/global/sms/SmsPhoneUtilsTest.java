package com.ondo.global.sms;

import com.ondo.global.config.SolapiProperties;
import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SmsPhoneUtilsTest {

    @Test
    void normalizePhone_stripsNonDigits() {
        assertEquals("01012345678", SmsPhoneUtils.normalizePhone("010-1234-5678"));
    }

    @Test
    void validatePhone_rejectsInvalidNumber() {
        assertThrows(BusinessException.class, () -> SmsPhoneUtils.validatePhone("0212345678"));
    }
}
