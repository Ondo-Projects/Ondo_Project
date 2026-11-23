package com.ondo.global.alert;

import java.util.regex.Pattern;

/**
 * 알림 메일에 개인정보가 섞이지 않도록 가립니다.
 * 오류 메시지에는 SQL 값 등 사용자 입력이 들어갈 수 있어, 이메일·전화번호·긴 숫자를 지우고 길이를 줄입니다.
 */
public final class AlertTextSanitizer {

    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE = Pattern.compile("01[016789][-\\s]?\\d{3,4}[-\\s]?\\d{4}");
    private static final Pattern LONG_NUMBER = Pattern.compile("\\d{7,}");
    private static final Pattern QUOTED = Pattern.compile("'[^']{1,200}'");

    static final int MAX_LENGTH = 300;

    private AlertTextSanitizer() {
    }

    public static String sanitize(String text) {
        if (text == null || text.isBlank()) {
            return "(메시지 없음)";
        }
        String masked = EMAIL.matcher(text).replaceAll("[이메일]");
        masked = PHONE.matcher(masked).replaceAll("[전화번호]");
        masked = LONG_NUMBER.matcher(masked).replaceAll("[숫자]");
        // SQL 오류의 'Duplicate entry '...'' 처럼 따옴표 안의 값은 사용자 입력일 수 있어 통째로 가립니다.
        masked = QUOTED.matcher(masked).replaceAll("'[값]'");
        masked = masked.replaceAll("\\s+", " ").trim();
        return masked.length() > MAX_LENGTH ? masked.substring(0, MAX_LENGTH) + "…" : masked;
    }

    /** 주소에서 ?query 를 떼어 냅니다 (검색어·이메일 등이 들어갈 수 있음) */
    public static String pathOnly(String uri) {
        if (uri == null) {
            return "";
        }
        int index = uri.indexOf('?');
        return index >= 0 ? uri.substring(0, index) : uri;
    }
}
