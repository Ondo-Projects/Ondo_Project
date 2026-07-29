package com.ondo.domain.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.dto.GuardianSmsSendRequestDTO;
import com.ondo.domain.user.dto.GuardianSmsVerifyRequestDTO;
import com.ondo.domain.user.entity.GuardianRelation;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

import static org.hamcrest.Matchers.containsString;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.solapi.dev-mode=true",
        "ondo.mail.dev-mode=true",
        "ondo.sms.otp.enabled=true",
        "ondo.sms.otp.resend-cooldown-seconds=60",
        "ondo.sms.otp.phone-max-per-hour=5",
        "ondo.sms.otp.ip-max-per-hour=20"
})
@AutoConfigureMockMvc
@Transactional
class GuardianSmsVerificationIntegrationTest {

    private static final String SCHOOL_CODE = "SMS_IT001";
    private static final String GUARDIAN_PHONE = "01077778888";
    private static final String GUARDIAN_PHONE_NORMALIZED = "01077778888";
    private static final String STUDENT_EMAIL = "under14-sms-it@test.com";

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

    @BeforeEach
    void setUp() {
        schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("SMS통합테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        clearSmsState(GUARDIAN_PHONE_NORMALIZED);
    }

    @Test
    void sendAndVerify_completesGuardianSmsVerification() throws Exception {
        sendSmsCode();

        String code = redisTemplate.opsForValue().get("sms:code:" + GUARDIAN_PHONE_NORMALIZED);
        assertThat(code).isNotBlank();

        verifySmsCode(code);

        assertThat(redisTemplate.opsForValue().get("sms:verified:" + GUARDIAN_PHONE_NORMALIZED))
                .isEqualTo("true");
    }

    @Test
    void verify_rejectsWrongCode() throws Exception {
        sendSmsCode();

        GuardianSmsVerifyRequestDTO request = new GuardianSmsVerifyRequestDTO();
        request.setPhone(GUARDIAN_PHONE);
        request.setCode("000000");

        mockMvc.perform(post("/api/auth/sms/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("인증번호가 일치하지 않습니다."));
    }

    @Test
    void send_rejectsImmediateResendWithinCooldown() throws Exception {
        sendSmsCode();

        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleSendRequest())))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("초 후")));
    }

    @Test
    void under14Signup_requiresVerifiedGuardianPhone() throws Exception {
        seedVerifiedEmail();

        mockMvc.perform(post("/join")
                        .param("role", Role.STUDENT.name())
                        .param("schoolCode", SCHOOL_CODE)
                        .param("name", "미인증학생")
                        .param("birthDate", "2015-01-01")
                        .param("username", "it-sms-unverified")
                        .param("password", "password1!")
                        .param("passwordConfirm", "password1!")
                        .param("email", STUDENT_EMAIL)
                        .param("guardianName", "홍부모")
                        .param("guardianPhone", GUARDIAN_PHONE)
                        .param("guardianRelation", GuardianRelation.MOTHER.name())
                        .param("agreeGuardianChildPrivacy", "true")
                        .param("agreeGuardianChildSensitive", "true")
                        .param("agreeGuardianIdentity", "true")
                        .param("agreeService", "true")
                        .param("agreePrivacy", "true")
                        .param("agreeSensitive", "true"))
                .andExpect(status().isOk())
                .andExpect(view().name("join"))
                .andExpect(model().attribute("errorMessage", "법정대리인 SMS 인증을 완료해 주세요."));

        assertThat(userRepository.existsByUsername("it-sms-unverified")).isFalse();
    }

    @Test
    void under14Signup_succeedsAfterSmsVerification() throws Exception {
        seedVerifiedEmail();
        sendSmsCode();

        String code = redisTemplate.opsForValue().get("sms:code:" + GUARDIAN_PHONE_NORMALIZED);
        verifySmsCode(code);

        mockMvc.perform(post("/join")
                        .param("role", Role.STUDENT.name())
                        .param("schoolCode", SCHOOL_CODE)
                        .param("name", "인증완료학생")
                        .param("birthDate", "2015-01-01")
                        .param("username", "it-sms-verified")
                        .param("password", "password1!")
                        .param("passwordConfirm", "password1!")
                        .param("email", STUDENT_EMAIL)
                        .param("guardianName", "홍부모")
                        .param("guardianPhone", GUARDIAN_PHONE)
                        .param("guardianRelation", GuardianRelation.MOTHER.name())
                        .param("agreeGuardianChildPrivacy", "true")
                        .param("agreeGuardianChildSensitive", "true")
                        .param("agreeGuardianIdentity", "true")
                        .param("agreeService", "true")
                        .param("agreePrivacy", "true")
                        .param("agreeSensitive", "true"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login?joined=true"));

        assertThat(userRepository.existsByUsername("it-sms-verified")).isTrue();
        assertThat(redisTemplate.opsForValue().get("sms:verified:" + GUARDIAN_PHONE_NORMALIZED)).isNull();
    }

    private void sendSmsCode() throws Exception {
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleSendRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("보호자 휴대폰으로 인증번호가 발송되었습니다."));
    }

    private void verifySmsCode(String code) throws Exception {
        GuardianSmsVerifyRequestDTO request = new GuardianSmsVerifyRequestDTO();
        request.setPhone(GUARDIAN_PHONE);
        request.setCode(code);

        mockMvc.perform(post("/api/auth/sms/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("법정대리인 SMS 인증이 완료되었습니다."));
    }

    private GuardianSmsSendRequestDTO sampleSendRequest() {
        GuardianSmsSendRequestDTO request = new GuardianSmsSendRequestDTO();
        request.setStudentName("홍학생");
        request.setGuardianName("홍부모");
        request.setPhone(GUARDIAN_PHONE);
        return request;
    }

    private void seedVerifiedEmail() {
        redisTemplate.opsForValue().set(
                "email:verified:" + STUDENT_EMAIL,
                "true",
                Duration.ofMinutes(30)
        );
    }

    private void clearSmsState(String normalizedPhone) {
        redisTemplate.delete(List.of(
                "sms:code:" + normalizedPhone,
                "sms:verified:" + normalizedPhone,
                "sms:rate:phone:cooldown:" + normalizedPhone,
                "sms:rate:phone:hour:" + normalizedPhone
        ));
    }
}
