package com.ondo.domain.user.config;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.GuardianRelation;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.crypto.FieldEncryptionService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** 보호자·교사 휴대전화가 DB에 암호문으로만 남는지, 예전 평문이 옮겨지는지 확인합니다. */
@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.weather.dev-mode=true",
        "ondo.retention.enabled=false"
})
@Transactional
class UserPhoneEncryptionIntegrationTest {

    private static final String TEACHER = "it-phone-teacher";
    private static final String STUDENT = "it-phone-student";
    private static final String TEACHER_PHONE = "01012345678";
    private static final String GUARDIAN_PHONE = "01098765432";

    @Autowired private UserRepository userRepository;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private FieldEncryptionService fieldEncryptionService;
    @Autowired private UserPhoneEncryptionMigration migration;

    @PersistenceContext
    private EntityManager em;

    private School school;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode("ITPHONE01")
                .schoolName("암호화테스트중학교")
                .region("서울")
                .schoolType("중학교")
                .build());
    }

    @Test
    void phonesAreStoredEncrypted_andReadAsPlainText() {
        saveUser(TEACHER, Role.TEACHER, TEACHER_PHONE, null);
        saveUser(STUDENT, Role.STUDENT, null, GUARDIAN_PHONE);
        em.flush();
        em.clear();

        String teacherCipher = encryptedColumn("phone_encrypted", TEACHER);
        String guardianCipher = encryptedColumn("guardian_phone_encrypted", STUDENT);

        assertThat(teacherCipher).isNotBlank().doesNotContain(TEACHER_PHONE);
        assertThat(guardianCipher).isNotBlank().doesNotContain(GUARDIAN_PHONE);
        assertThat(fieldEncryptionService.decrypt(teacherCipher)).isEqualTo(TEACHER_PHONE);
        assertThat(fieldEncryptionService.decrypt(guardianCipher)).isEqualTo(GUARDIAN_PHONE);

        assertThat(userRepository.findByUsername(TEACHER).orElseThrow().getPhone()).isEqualTo(TEACHER_PHONE);
        assertThat(userRepository.findByUsername(STUDENT).orElseThrow().getGuardianPhone()).isEqualTo(GUARDIAN_PHONE);
    }

    @Test
    void sameNumber_producesDifferentCipherText() {
        saveUser(TEACHER, Role.TEACHER, TEACHER_PHONE, null);
        saveUser(STUDENT, Role.TEACHER, TEACHER_PHONE, null);
        em.flush();

        assertThat(encryptedColumn("phone_encrypted", TEACHER))
                .isNotEqualTo(encryptedColumn("phone_encrypted", STUDENT));
    }

    @Test
    void migration_movesLegacyPlainTextAndClearsIt() {
        assumeTrue(columnExists("phone") && columnExists("guardian_phone"),
                "예전 평문 칸이 없는 새 DB라 이전 테스트를 건너뜁니다.");

        saveUser(TEACHER, Role.TEACHER, null, null);
        saveUser(STUDENT, Role.STUDENT, null, null);
        em.flush();
        em.createNativeQuery("UPDATE users SET phone = :phone, phone_encrypted = NULL WHERE username = :username")
                .setParameter("phone", TEACHER_PHONE).setParameter("username", TEACHER).executeUpdate();
        em.createNativeQuery("UPDATE users SET guardian_phone = :phone, guardian_phone_encrypted = NULL WHERE username = :username")
                .setParameter("phone", GUARDIAN_PHONE).setParameter("username", STUDENT).executeUpdate();

        migration.run();
        em.clear();

        assertThat(plainColumn("phone", TEACHER)).isNull();
        assertThat(plainColumn("guardian_phone", STUDENT)).isNull();
        assertThat(userRepository.findByUsername(TEACHER).orElseThrow().getPhone()).isEqualTo(TEACHER_PHONE);
        assertThat(userRepository.findByUsername(STUDENT).orElseThrow().getGuardianPhone()).isEqualTo(GUARDIAN_PHONE);

        // 두 번 실행해도 값이 바뀌지 않음
        migration.run();
        em.clear();
        assertThat(userRepository.findByUsername(TEACHER).orElseThrow().getPhone()).isEqualTo(TEACHER_PHONE);
    }

    @Test
    void unreadableCipherText_doesNotBreakLoading() {
        saveUser(TEACHER, Role.TEACHER, TEACHER_PHONE, null);
        em.flush();
        em.createNativeQuery("UPDATE users SET phone_encrypted = 'not-a-valid-cipher' WHERE username = :username")
                .setParameter("username", TEACHER).executeUpdate();
        em.clear();

        User loaded = userRepository.findByUsername(TEACHER).orElseThrow();

        assertThat(loaded.getPhone()).isNull();
        assertThat(loaded.getName()).isEqualTo(TEACHER);
    }

    private void saveUser(String username, Role role, String phone, String guardianPhone) {
        userRepository.save(User.builder()
                .username(username)
                .password("encoded")
                .role(role)
                .school(school)
                .name(username)
                .phone(phone)
                .guardianName(guardianPhone != null ? "보호자" : null)
                .guardianPhone(guardianPhone)
                .guardianRelation(guardianPhone != null ? GuardianRelation.MOTHER : null)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    private String encryptedColumn(String column, String username) {
        return (String) em.createNativeQuery("SELECT " + column + " FROM users WHERE username = :username")
                .setParameter("username", username)
                .getSingleResult();
    }

    private String plainColumn(String column, String username) {
        return encryptedColumn(column, username);
    }

    private boolean columnExists(String column) {
        Number count = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM information_schema.columns"
                                + " WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = :column")
                .setParameter("column", column)
                .getSingleResult();
        return count.intValue() > 0;
    }
}
