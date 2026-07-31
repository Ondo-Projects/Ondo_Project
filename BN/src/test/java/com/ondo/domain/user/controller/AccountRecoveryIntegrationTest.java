package com.ondo.domain.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.dto.FindIdSendRequestDTO;
import com.ondo.domain.user.dto.FindIdVerifyRequestDTO;
import com.ondo.domain.user.dto.PasswordRecoveryResetRequestDTO;
import com.ondo.domain.user.dto.PasswordRecoverySendRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.mail.dev-mode=true",
        "ondo.solapi.dev-mode=true",
        "ondo.sms.otp.enabled=true",
        "ondo.sms.otp.resend-cooldown-seconds=60",
        "ondo.sms.otp.phone-max-per-hour=5",
        "ondo.sms.otp.ip-max-per-hour=20"
})
@AutoConfigureMockMvc
@Transactional
class AccountRecoveryIntegrationTest {

    private static final String SCHOOL_CODE = "RECOVERY_IT001";
    private static final String STUDENT_USERNAME = "recovery-student";
    private static final String TEACHER_USERNAME = "recovery-teacher";
    private static final String ADMIN_USERNAME = "recovery-admin";
    private static final String STUDENT_EMAIL = "recovery-student@test.com";
    private static final String TEACHER_EMAIL = "recovery-teacher@korea.kr";
    private static final String ADMIN_EMAIL = "recovery-admin@ondo.local";
    private static final String STUDENT_NAME = "김학생";
    private static final LocalDate STUDENT_BIRTH_DATE = LocalDate.of(2010, 3, 15);
    private static final String ORIGINAL_PASSWORD = "password1!";
    private static final String NEW_PASSWORD = "newpass2@";
    private static final String SEND_SUCCESS_MESSAGE =
            "입력하신 이메일로 인증번호를 발송했습니다. 메일함을 확인해 주세요.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("Recovery통합테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        School school = schoolRepository.findById(SCHOOL_CODE).orElseThrow();
        LocalDateTime agreedAt = LocalDateTime.now();

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode(ORIGINAL_PASSWORD))
                .role(Role.STUDENT)
                .school(school)
                .name(STUDENT_NAME)
                .birthDate(STUDENT_BIRTH_DATE)
                .email(STUDENT_EMAIL)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode(ORIGINAL_PASSWORD))
                .role(Role.TEACHER)
                .school(school)
                .name("박교사")
                .email(TEACHER_EMAIL)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());

        userRepository.save(User.builder()
                .username(ADMIN_USERNAME)
                .password(passwordEncoder.encode(ORIGINAL_PASSWORD))
                .role(Role.ADMIN)
                .school(school)
                .name("관리자")
                .email(ADMIN_EMAIL)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());

        clearRecoveryState(STUDENT_EMAIL);
        clearRecoveryState(TEACHER_EMAIL);
        clearRecoveryState(ADMIN_EMAIL);
    }

    @Test
    void findId_sendAndVerify_returnsMaskedUsername() throws Exception {
        sendFindIdCode(STUDENT_NAME, STUDENT_EMAIL, STUDENT_BIRTH_DATE);

        String code = redisTemplate.opsForValue().get(findIdCodeKey(STUDENT_EMAIL));
        assertThat(code).isNotBlank();

        FindIdVerifyRequestDTO verifyRequest = new FindIdVerifyRequestDTO();
        verifyRequest.setName(STUDENT_NAME);
        verifyRequest.setEmail(STUDENT_EMAIL);
        verifyRequest.setBirthDate(STUDENT_BIRTH_DATE);
        verifyRequest.setCode(code);

        mockMvc.perform(post("/api/auth/recovery/id/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(STUDENT_USERNAME))
                .andExpect(jsonPath("$.maskedUsername").value("re************nt"))
                .andExpect(jsonPath("$.message").value("아이디를 확인했습니다."));
    }

    @Test
    void findId_send_returnsGenericSuccessEvenWhenUserNotFound() throws Exception {
        FindIdSendRequestDTO request = new FindIdSendRequestDTO();
        request.setName("없는사용자");
        request.setEmail("missing-user@test.com");
        request.setBirthDate(LocalDate.of(2000, 1, 1));

        mockMvc.perform(post("/api/auth/recovery/id/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(SEND_SUCCESS_MESSAGE));

        assertThat(redisTemplate.opsForValue().get(findIdCodeKey("missing-user@test.com"))).isNull();
    }

    @Test
    void findId_verify_rejectsWrongCode() throws Exception {
        sendFindIdCode(STUDENT_NAME, STUDENT_EMAIL, STUDENT_BIRTH_DATE);

        FindIdVerifyRequestDTO verifyRequest = new FindIdVerifyRequestDTO();
        verifyRequest.setName(STUDENT_NAME);
        verifyRequest.setEmail(STUDENT_EMAIL);
        verifyRequest.setBirthDate(STUDENT_BIRTH_DATE);
        verifyRequest.setCode("000000");

        mockMvc.perform(post("/api/auth/recovery/id/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("인증번호가 일치하지 않습니다."));
    }

    @Test
    void passwordRecovery_sendAndReset_changesPassword() throws Exception {
        sendPasswordResetCode(TEACHER_USERNAME, TEACHER_EMAIL);

        String scopeKey = TEACHER_USERNAME.toLowerCase(Locale.ROOT) + ":" + TEACHER_EMAIL.toLowerCase(Locale.ROOT);
        String code = redisTemplate.opsForValue().get(passwordResetCodeKey(scopeKey));
        assertThat(code).isNotBlank();

        PasswordRecoveryResetRequestDTO resetRequest = new PasswordRecoveryResetRequestDTO();
        resetRequest.setUsername(TEACHER_USERNAME);
        resetRequest.setEmail(TEACHER_EMAIL);
        resetRequest.setCode(code);
        resetRequest.setPassword(NEW_PASSWORD);
        resetRequest.setPasswordConfirm(NEW_PASSWORD);

        mockMvc.perform(post("/api/auth/recovery/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요."));

        User updated = userRepository.findByUsername(TEACHER_USERNAME).orElseThrow();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, updated.getPassword())).isTrue();
        assertThat(passwordEncoder.matches(ORIGINAL_PASSWORD, updated.getPassword())).isFalse();
    }

    @Test
    void passwordRecovery_send_doesNotSendCodeForAdminAccount() throws Exception {
        sendPasswordResetCode(ADMIN_USERNAME, ADMIN_EMAIL);

        String scopeKey = ADMIN_USERNAME.toLowerCase(Locale.ROOT) + ":" + ADMIN_EMAIL.toLowerCase(Locale.ROOT);
        assertThat(redisTemplate.opsForValue().get(passwordResetCodeKey(scopeKey))).isNull();
    }

    @Test
    void passwordRecovery_reset_rejectsPasswordMismatch() throws Exception {
        sendPasswordResetCode(TEACHER_USERNAME, TEACHER_EMAIL);

        String scopeKey = TEACHER_USERNAME.toLowerCase(Locale.ROOT) + ":" + TEACHER_EMAIL.toLowerCase(Locale.ROOT);
        String code = redisTemplate.opsForValue().get(passwordResetCodeKey(scopeKey));
        assertThat(code).isNotBlank();

        PasswordRecoveryResetRequestDTO resetRequest = new PasswordRecoveryResetRequestDTO();
        resetRequest.setUsername(TEACHER_USERNAME);
        resetRequest.setEmail(TEACHER_EMAIL);
        resetRequest.setCode(code);
        resetRequest.setPassword(NEW_PASSWORD);
        resetRequest.setPasswordConfirm("different2@");

        mockMvc.perform(post("/api/auth/recovery/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("비밀번호와 비밀번호 확인이 일치하지 않습니다."));
    }

    private void sendFindIdCode(String name, String email, LocalDate birthDate) throws Exception {
        FindIdSendRequestDTO request = new FindIdSendRequestDTO();
        request.setName(name);
        request.setEmail(email);
        request.setBirthDate(birthDate);

        mockMvc.perform(post("/api/auth/recovery/id/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(SEND_SUCCESS_MESSAGE));
    }

    private void sendPasswordResetCode(String username, String email) throws Exception {
        PasswordRecoverySendRequestDTO request = new PasswordRecoverySendRequestDTO();
        request.setUsername(username);
        request.setEmail(email);

        mockMvc.perform(post("/api/auth/recovery/password/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(SEND_SUCCESS_MESSAGE));
    }

    private String findIdCodeKey(String email) {
        return "recovery:code:find-id:" + email.trim().toLowerCase(Locale.ROOT);
    }

    private String passwordResetCodeKey(String scopeKey) {
        return "recovery:code:reset-password:" + scopeKey;
    }

    private void clearRecoveryState(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        redisTemplate.delete(findIdCodeKey(normalizedEmail));
        redisTemplate.delete("recovery:rate:email:cooldown:" + normalizedEmail);
        redisTemplate.delete("recovery:rate:email:hour:" + normalizedEmail);
    }
}
