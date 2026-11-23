package com.ondo.domain.user.config;

import com.ondo.global.crypto.FieldEncryptionService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 예전에 평문으로 저장한 보호자·교사 휴대전화를 암호화 칸으로 옮기고, 평문 칸을 비웁니다.
 * <ul>
 *   <li>users.phone → users.phone_encrypted</li>
 *   <li>users.guardian_phone → users.guardian_phone_encrypted</li>
 * </ul>
 * 서버가 켜질 때마다 실행되지만, 옮길 평문이 없으면 아무것도 하지 않습니다(여러 번 실행해도 안전).
 * 평문 칸이 없는 새 DB에서는 건너뜁니다. 모두 옮겨진 것을 확인하면 평문 칸은 직접 지워도 됩니다.
 */
@Component
@Order(11)
@RequiredArgsConstructor
@Slf4j
public class UserPhoneEncryptionMigration implements CommandLineRunner {

    private final FieldEncryptionService fieldEncryptionService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        int teacherPhones = migrateColumn("phone", "phone_encrypted");
        int guardianPhones = migrateColumn("guardian_phone", "guardian_phone_encrypted");
        if (teacherPhones > 0 || guardianPhones > 0) {
            log.warn("[암호화 이전] 평문 휴대전화를 암호화했습니다: 교사 {}건, 보호자 {}건. 평문 칸은 비웠습니다.",
                    teacherPhones, guardianPhones);
        }
    }

    /** 평문 칸의 값을 암호화 칸으로 옮기고 평문 칸을 비운 뒤, 옮긴 건수를 돌려줍니다. */
    int migrateColumn(String plainColumn, String encryptedColumn) {
        if (!columnExists(plainColumn)) {
            return 0;
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "SELECT username, " + plainColumn + " FROM users"
                        + " WHERE " + plainColumn + " IS NOT NULL AND " + plainColumn + " <> ''"
        ).getResultList();

        for (Object[] row : rows) {
            String username = (String) row[0];
            String plain = (String) row[1];
            entityManager.createNativeQuery(
                            "UPDATE users SET " + encryptedColumn + " = :cipher, " + plainColumn + " = NULL"
                                    + " WHERE username = :username")
                    .setParameter("cipher", fieldEncryptionService.encrypt(plain.trim()))
                    .setParameter("username", username)
                    .executeUpdate();
        }
        return rows.size();
    }

    private boolean columnExists(String column) {
        Number count = (Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM information_schema.columns"
                                + " WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = :column")
                .setParameter("column", column)
                .getSingleResult();
        return count.intValue() > 0;
    }
}
