package com.ondo.global.util;

import com.ondo.global.error.BusinessException;

import java.util.regex.Pattern;

public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 100;
    private static final Pattern LETTER_PATTERN = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[!@#$%^&*(),.?\":{}|<>\\[\\]\\-_=+;'/\\\\`~]");

    private PasswordValidator() {
    }

    public static void validate(String password, String username) {
        if (password == null || password.isBlank()) {
            throw new BusinessException("비밀번호를 입력해 주세요.");
        }
        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new BusinessException("비밀번호는 8자 이상 100자 이하로 입력해 주세요.");
        }
        if (password.contains(" ")) {
            throw new BusinessException("비밀번호에 공백은 사용할 수 없습니다.");
        }
        if (!LETTER_PATTERN.matcher(password).find()) {
            throw new BusinessException("비밀번호에 영문자를 1자 이상 포함해 주세요.");
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            throw new BusinessException("비밀번호에 숫자를 1자 이상 포함해 주세요.");
        }
        if (!SPECIAL_PATTERN.matcher(password).find()) {
            throw new BusinessException("비밀번호에 특수문자를 1자 이상 포함해 주세요.");
        }
        if (username != null && !username.isBlank() && password.equalsIgnoreCase(username)) {
            throw new BusinessException("비밀번호는 아이디와 동일하게 설정할 수 없습니다.");
        }
    }
}
