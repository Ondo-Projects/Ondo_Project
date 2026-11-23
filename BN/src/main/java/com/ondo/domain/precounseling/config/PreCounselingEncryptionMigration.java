package com.ondo.domain.precounseling.config;

import com.ondo.domain.precounseling.entity.StudentPreCounselingProfile;
import com.ondo.domain.precounseling.repository.StudentPreCounselingProfileRepository;
import com.ondo.global.config.EncryptionProperties;
import com.ondo.global.crypto.FieldEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 개발용(공개) 키로 암호화된 사전상담 전화번호를 현재 키로 다시 암호화합니다.
 * ondo.encryption.migrate-from-dev-key=true 일 때만 실행되며, 여러 번 실행해도 안전합니다.
 */
@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class PreCounselingEncryptionMigration implements CommandLineRunner {

    private final EncryptionProperties encryptionProperties;
    private final FieldEncryptionService fieldEncryptionService;
    private final StudentPreCounselingProfileRepository profileRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (!encryptionProperties.isMigrateFromDevKey()) {
            return;
        }
        if (fieldEncryptionService.isUsingDevKey()) {
            log.warn("[암호화 마이그레이션] 현재 키가 개발용 키라 재암호화를 건너뜁니다. ondo.encryption.key 를 먼저 설정하세요.");
            return;
        }

        List<StudentPreCounselingProfile> profiles = profileRepository.findAll();
        int migrated = 0;
        int failed = 0;

        for (StudentPreCounselingProfile profile : profiles) {
            try {
                String studentPhone = fieldEncryptionService.reencryptFromDevKey(profile.getStudentPhoneEncrypted());
                String parentPhone = fieldEncryptionService.reencryptFromDevKey(profile.getParentPhoneEncrypted());
                if (studentPhone != null || parentPhone != null) {
                    profile.replaceEncryptedPhones(
                            studentPhone != null ? studentPhone : profile.getStudentPhoneEncrypted(),
                            parentPhone != null ? parentPhone : profile.getParentPhoneEncrypted()
                    );
                    migrated++;
                }
            } catch (IllegalStateException exception) {
                failed++;
                log.error("[암호화 마이그레이션] 복호화 실패: student={}", profile.getStudentUsername());
            }
        }

        log.warn("[암호화 마이그레이션] 사전상담 {}건 중 재암호화 {}건, 실패 {}건. " +
                        "실패 0건을 확인했으면 ondo.encryption.migrate-from-dev-key=false 로 바꾸고 재시작하세요.",
                profiles.size(), migrated, failed);
    }
}
