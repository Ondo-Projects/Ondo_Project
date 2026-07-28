package com.ondo.domain.user.config;

import com.ondo.domain.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(5)
@RequiredArgsConstructor
@Slf4j
public class UserActiveMigrationBootstrap implements CommandLineRunner {

    private final UserActiveMigrationProperties migrationProperties;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        ensureActiveColumnDefault();
        fixLegacyInactiveUsersIfEnabled();
    }

    private void ensureActiveColumnDefault() {
        try {
            entityManager.createNativeQuery(
                    "ALTER TABLE users MODIFY COLUMN active bit(1) NOT NULL DEFAULT b'1'"
            ).executeUpdate();
            log.debug("users.active 컬럼 DEFAULT b'1' 적용 완료");
        } catch (Exception exception) {
            log.debug("users.active 컬럼 DEFAULT 설정을 건너뜁니다: {}", exception.getMessage());
        }
    }

    private void fixLegacyInactiveUsersIfEnabled() {
        if (!migrationProperties.isEnabled()) {
            return;
        }

        int updated = userRepository.activateAllInactive();
        if (updated > 0) {
            log.warn(
                    "기존 회원 {}명의 active 상태를 활성(true)으로 보정했습니다. " +
                            "보정이 끝났다면 ondo.user.legacy-active-fix.enabled=false 로 변경하세요.",
                    updated
            );
        }
    }
}
