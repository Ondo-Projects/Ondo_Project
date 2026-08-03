package com.ondo.domain.user.policy;

import com.ondo.global.error.BusinessException;

import java.util.Locale;
import java.util.Set;

/**
 * 교사 가입에 허용되는 시·도교육청 및 교육부 공직 메일 도메인.
 */
public final class TeacherEmailDomains {

    private static final Set<String> ALLOWED_DOMAINS = Set.of(
            "sen.go.kr",
            "pen.go.kr",
            "dge.go.kr",
            "ice.go.kr",
            "gen.go.kr",
            "dje.go.kr",
            "use.go.kr",
            "sje.go.kr",
            "goe.go.kr",
            "kwe.go.kr",
            "cbe.go.kr",
            "cne.go.kr",
            "jbe.go.kr",
            "jne.go.kr",
            "gbe.kr",
            "gne.go.kr",
            "jje.go.kr",
            "korea.kr"
    );

    private TeacherEmailDomains() {
    }

    public static Set<String> allowedDomains() {
        return ALLOWED_DOMAINS;
    }

    public static boolean isAllowedDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return false;
        }
        return ALLOWED_DOMAINS.contains(normalizeDomain(domain));
    }

    public static void validateTeacherEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        int atIndex = normalizedEmail.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == normalizedEmail.length() - 1) {
            throw new BusinessException("올바른 교사 이메일 형식을 입력해 주세요.");
        }

        String domain = normalizedEmail.substring(atIndex + 1);
        if (!isAllowedDomain(domain)) {
            throw new BusinessException(
                    "교사 가입은 시·도교육청 공직 메일(@sen.go.kr, @goe.go.kr 등) 또는 @korea.kr만 사용할 수 있습니다."
            );
        }
    }

    public static String extractDomain(String email) {
        String normalizedEmail = normalizeEmail(email);
        int atIndex = normalizedEmail.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == normalizedEmail.length() - 1) {
            return "";
        }
        return normalizedEmail.substring(atIndex + 1);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeDomain(String domain) {
        return domain.trim().toLowerCase(Locale.ROOT);
    }
}
