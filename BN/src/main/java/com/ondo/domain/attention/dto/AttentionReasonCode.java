package com.ondo.domain.attention.dto;

/** 담임이 살펴보면 좋을 이유. 진단이 아니라 '확인해 보세요'라는 안내입니다. */
public enum AttentionReasonCode {
    /** 오늘 기분을 '힘듦'으로 남김 */
    STORMY_TODAY,
    /** 최근 7일 중 3일 이상 '우울'·'힘듦' */
    LOW_MOOD_REPEATED,
    /** 아직 끝나지 않은 학교폭력 상담 */
    SCHOOL_VIOLENCE_OPEN
}
