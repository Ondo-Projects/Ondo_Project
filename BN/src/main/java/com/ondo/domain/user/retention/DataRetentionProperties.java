package com.ondo.domain.user.retention;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 개인정보 보관 기간 설정.
 * 값을 바꾸면 개인정보처리방침(FN/src/v2/legal/privacy.ts)의 보유 기간 문구도 함께 고쳐야 합니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ondo.retention")
public class DataRetentionProperties {

    /** 매일 자동 파기를 실행할지 여부 */
    private boolean enabled = true;

    /** 실행 시각 (Asia/Seoul 기준, 매일 04:30) */
    private String cron = "0 30 4 * * *";

    /** 탈퇴 후 이 일수가 지나면 파기합니다. 매일 실행되므로 탈퇴 후 최대 (이 값 + 1)일 안에 파기됩니다. */
    private int withdrawnGraceDays = 3;

    /** 상담·사전상담 열람 기록과 관리자 작업 기록 보관 일수 (2년) */
    private int accessLogRetentionDays = 730;

    /** 익명화한 탈퇴 사유 기록 보관 일수 (1년) */
    private int withdrawalRecordRetentionDays = 365;
}
