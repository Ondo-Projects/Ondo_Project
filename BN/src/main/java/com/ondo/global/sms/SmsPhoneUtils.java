package com.ondo.global.sms;

import com.ondo.global.error.BusinessException;

public final class SmsPhoneUtils {

    private SmsPhoneUtils() {
    }

    public static String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9]", "");
    }

    public static void validatePhone(String phone) {
        String normalized = normalizePhone(phone);
        if (!normalized.matches("^01[0-9]{8,9}$")) {
            throw new BusinessException("올바른 휴대전화 번호를 입력해 주세요.");
        }
    }
}
