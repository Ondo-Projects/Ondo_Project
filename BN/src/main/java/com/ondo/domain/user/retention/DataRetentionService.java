package com.ondo.domain.user.retention;

import com.ondo.domain.user.entity.Role;
import com.ondo.global.alert.OperatorAlertService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** 보관 기간이 지난 개인정보를 파기합니다. 개인정보처리방침의 '보유 및 이용 기간'을 실제로 지키는 곳입니다. */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataRetentionService {

    private final DataRetentionProperties properties;
    private final WithdrawnUserPurger withdrawnUserPurger;
    private final OperatorAlertService operatorAlertService;

    @PersistenceContext
    private EntityManager em;

    /** 탈퇴 후 보관 기간이 지난 회원을 파기합니다. 한 명이 실패해도 나머지는 계속 처리합니다. */
    public int purgeWithdrawnUsers(LocalDateTime now) {
        LocalDateTime cutoff = now.minusDays(properties.getWithdrawnGraceDays());
        List<String> targets = findWithdrawnTargets(cutoff);
        int purged = 0;
        for (String username : targets) {
            try {
                if (withdrawnUserPurger.purge(username, now)) {
                    purged++;
                }
            } catch (RuntimeException exception) {
                log.error("[retention] 탈퇴 회원 파기 실패 — 다음 실행 때 다시 시도합니다.", exception);
                operatorAlertService.notifyJobFailure("탈퇴 회원 파기", exception);
            }
        }
        if (!targets.isEmpty()) {
            log.info("[retention] 탈퇴 회원 파기 {}/{}명", purged, targets.size());
        }
        return purged;
    }

    @Transactional(readOnly = true)
    public List<String> findWithdrawnTargets(LocalDateTime cutoff) {
        return em.createQuery("""
                        SELECT u.username FROM User u
                        WHERE u.active = false
                          AND u.withdrawnAt IS NOT NULL
                          AND u.withdrawnAt < :cutoff
                          AND u.purgedAt IS NULL
                          AND u.role <> :admin
                        """, String.class)
                .setParameter("cutoff", cutoff)
                .setParameter("admin", Role.ADMIN)
                .getResultList();
    }

    /** 보관 기간이 지난 열람 기록, 관리자 작업 기록, 탈퇴 사유 기록을 지웁니다. */
    @Transactional
    public int purgeExpiredLogs(LocalDateTime now) {
        LocalDateTime logCutoff = now.minusDays(properties.getAccessLogRetentionDays());
        LocalDateTime withdrawalCutoff = now.minusDays(properties.getWithdrawalRecordRetentionDays());

        int deleted = 0;
        deleted += em.createQuery("DELETE FROM CounselingAccessLog l WHERE l.accessedAt < :cutoff")
                .setParameter("cutoff", logCutoff).executeUpdate();
        deleted += em.createQuery("DELETE FROM PreCounselingProfileAccessLog l WHERE l.accessedAt < :cutoff")
                .setParameter("cutoff", logCutoff).executeUpdate();
        deleted += em.createQuery("DELETE FROM AdminActivityLog l WHERE l.createdAt < :cutoff")
                .setParameter("cutoff", logCutoff).executeUpdate();
        deleted += em.createQuery("DELETE FROM UserWithdrawal w WHERE w.withdrawnAt < :cutoff")
                .setParameter("cutoff", withdrawalCutoff).executeUpdate();
        if (deleted > 0) {
            log.info("[retention] 보관 기간이 지난 기록 {}건 파기", deleted);
        }
        return deleted;
    }
}
