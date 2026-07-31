package com.ondo.domain.user.service;

import java.util.Locale;

final class AccountRecoverySupport {

    static final String SEND_SUCCESS_MESSAGE =
            "입력하신 이메일로 인증번호를 발송했습니다. 메일함을 확인해 주세요.";

    private AccountRecoverySupport() {
    }

    static String maskUsername(String username) {
        if (username == null || username.isBlank()) {
            return "";
        }
        if (username.length() <= 2) {
            return "*".repeat(username.length());
        }
        if (username.length() <= 4) {
            return username.charAt(0) + "*".repeat(username.length() - 2) + username.charAt(username.length() - 1);
        }
        return username.substring(0, 2)
                + "*".repeat(username.length() - 4)
                + username.substring(username.length() - 2);
    }

    static String passwordScopeKey(String username, String email) {
        return username.trim().toLowerCase(Locale.ROOT) + ":" + email.trim().toLowerCase(Locale.ROOT);
    }
}
