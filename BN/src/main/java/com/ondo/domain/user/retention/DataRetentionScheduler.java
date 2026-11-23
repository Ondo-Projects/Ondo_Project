package com.ondo.domain.user.retention;

import com.ondo.global.alert.OperatorAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** 매일 새벽 보관 기간이 지난 개인정보를 파기합니다. ondo.retention.enabled=false 로 끌 수 있습니다. */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataRetentionScheduler {

    private final DataRetentionProperties properties;
    private final DataRetentionService dataRetentionService;
    private final OperatorAlertService operatorAlertService;

    @Scheduled(cron = "${ondo.retention.cron:0 30 4 * * *}", zone = "Asia/Seoul")
    public void run() {
        if (!properties.isEnabled()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        try {
            dataRetentionService.purgeWithdrawnUsers(now);
            dataRetentionService.purgeExpiredLogs(now);
        } catch (RuntimeException exception) {
            log.error("[retention] 자동 파기 실행 실패", exception);
            operatorAlertService.notifyJobFailure("개인정보 자동 파기", exception);
        }
    }
}
