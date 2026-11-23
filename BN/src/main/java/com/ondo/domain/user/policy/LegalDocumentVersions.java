package com.ondo.domain.user.policy;

/**
 * 현재 시행 중인 이용약관·개인정보처리방침 버전 (시행일).
 * 약관을 개정하면 FN/src/v2/legal/terms.ts 의 TERMS_VERSION, privacy.ts 의 PRIVACY_VERSION 과 함께 바꿔야 합니다.
 * 가입 화면이 보여 준 버전과 이 값이 다르면 가입을 막아, 회원이 실제로 본 약관 버전만 기록되게 합니다.
 */
public final class LegalDocumentVersions {

    public static final String TERMS = "2026-12-01";
    public static final String PRIVACY = "2026-12-01";

    private LegalDocumentVersions() {
    }
}
