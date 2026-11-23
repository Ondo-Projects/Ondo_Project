package com.ondo.global.alert;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AlertTextSanitizerTest {

    @Test
    void masksEmailPhoneLongNumberAndQuotedValues() {
        String raw = "Duplicate entry 'kim@school.kr' for key 'users.email' 연락처 010-1234-5678 번호 9876543210";

        String result = AlertTextSanitizer.sanitize(raw);

        assertThat(result)
                .doesNotContain("kim@school.kr")
                .doesNotContain("010-1234-5678")
                .doesNotContain("9876543210")
                .doesNotContain("users.email")
                .contains("[전화번호]")
                .contains("[숫자]")
                .contains("'[값]'");
    }

    @Test
    void masksBareEmail() {
        assertThat(AlertTextSanitizer.sanitize("user lee.student@gmail.com not found"))
                .isEqualTo("user [이메일] not found");
    }

    @Test
    void truncatesLongMessage() {
        String result = AlertTextSanitizer.sanitize("가".repeat(500));

        assertThat(result).hasSize(AlertTextSanitizer.MAX_LENGTH + 1).endsWith("…");
    }

    @Test
    void emptyMessage() {
        assertThat(AlertTextSanitizer.sanitize(null)).isEqualTo("(메시지 없음)");
        assertThat(AlertTextSanitizer.sanitize("  ")).isEqualTo("(메시지 없음)");
    }

    @Test
    void pathOnly_dropsQueryString() {
        assertThat(AlertTextSanitizer.pathOnly("/api/admin/users?keyword=kim@school.kr")).isEqualTo("/api/admin/users");
        assertThat(AlertTextSanitizer.pathOnly("/api/teacher/attention")).isEqualTo("/api/teacher/attention");
        assertThat(AlertTextSanitizer.pathOnly(null)).isEmpty();
    }
}
