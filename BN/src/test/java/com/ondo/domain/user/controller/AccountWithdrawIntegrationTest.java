package com.ondo.domain.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.dto.AccountWithdrawRequestDTO;
import com.ondo.domain.user.dto.LoginRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.StudentWithdrawReason;
import com.ondo.domain.user.entity.TeacherWithdrawReason;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.repository.UserWithdrawalRepository;
import com.ondo.global.util.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.mail.dev-mode=true",
        "ondo.solapi.dev-mode=true"
})
@AutoConfigureMockMvc
@Transactional
class AccountWithdrawIntegrationTest {

    private static final String SCHOOL_CODE = "WITHDRAW_IT001";
    private static final String STUDENT_USERNAME = "withdraw-student";
    private static final String TEACHER_USERNAME = "withdraw-teacher";
    private static final String ADMIN_USERNAME = "withdraw-admin";
    private static final String PASSWORD = "password1!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserWithdrawalRepository userWithdrawalRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("Withdraw통합테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        LocalDateTime agreedAt = LocalDateTime.now();

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode(PASSWORD))
                .role(Role.STUDENT)
                .school(school)
                .name("김학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode(PASSWORD))
                .role(Role.TEACHER)
                .school(school)
                .name("박교사")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());

        userRepository.save(User.builder()
                .username(ADMIN_USERNAME)
                .password(passwordEncoder.encode(PASSWORD))
                .role(Role.ADMIN)
                .school(school)
                .name("관리자")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(agreedAt)
                .build());
    }

    @Test
    void withdraw_deactivatesStudentAndRecordsReason() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest(
                PASSWORD,
                StudentWithdrawReason.GRADUATED_OR_TRANSFERRED.name(),
                null
        );

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("회원 탈퇴가 완료되었습니다."));

        User user = userRepository.findByUsername(STUDENT_USERNAME).orElseThrow();
        assertThat(user.isActive()).isFalse();
        assertThat(user.getWithdrawnAt()).isNotNull();

        assertThat(userWithdrawalRepository.findAll())
                .anySatisfy(withdrawal -> {
                    assertThat(withdrawal.getUsername()).isEqualTo(STUDENT_USERNAME);
                    assertThat(withdrawal.getRole()).isEqualTo(Role.STUDENT);
                    assertThat(withdrawal.getReason()).isEqualTo(StudentWithdrawReason.GRADUATED_OR_TRANSFERRED.name());
                });
    }

    @Test
    void withdraw_allowsTeacherOtherReasonDetail() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest(
                PASSWORD,
                TeacherWithdrawReason.OTHER.name(),
                "타 학교로 발령"
        );

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("회원 탈퇴가 완료되었습니다."));

        assertThat(userWithdrawalRepository.findAll())
                .anySatisfy(withdrawal -> {
                    assertThat(withdrawal.getUsername()).isEqualTo(TEACHER_USERNAME);
                    assertThat(withdrawal.getReason()).isEqualTo(TeacherWithdrawReason.OTHER.name());
                    assertThat(withdrawal.getReasonDetail()).isEqualTo("타 학교로 발령");
                });
    }

    @Test
    void withdraw_rejectsWrongPassword() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest("wrongpass1!", null, null);

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("비밀번호가 일치하지 않습니다."));
    }

    @Test
    void withdraw_requiresAgreement() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest(PASSWORD, null, null);
        request.setAgreed(false);

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("탈퇴 안내에 동의해 주세요."));
    }

    @Test
    void withdraw_rejectsAdminAccount() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest(PASSWORD, null, null);

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("관리자 계정은 회원 탈퇴 API로 탈퇴할 수 없습니다."));
    }

    @Test
    void withdraw_blocksSubsequentMeAndLogin() throws Exception {
        String accessToken = bearerToken(STUDENT_USERNAME, Role.STUDENT);
        AccountWithdrawRequestDTO request = withdrawRequest(PASSWORD, StudentWithdrawReason.NO_LONGER_NEEDED.name(), null);

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("유효하지 않은 토큰입니다."));

        LoginRequestDTO loginRequest = new LoginRequestDTO();
        loginRequest.setUsername(STUDENT_USERNAME);
        loginRequest.setPassword(PASSWORD);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("비활성화된 계정입니다. 관리자에게 문의해 주세요."));
    }

    @Test
    void withdraw_rejectsReasonForOtherRole() throws Exception {
        AccountWithdrawRequestDTO request = withdrawRequest(
                PASSWORD,
                TeacherWithdrawReason.SCHOOL_NOT_USING.name(),
                null
        );

        mockMvc.perform(post("/api/auth/me/withdraw")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("올바른 탈퇴 사유를 선택해 주세요."));
    }

    private AccountWithdrawRequestDTO withdrawRequest(String password, String reason, String reasonDetail) {
        AccountWithdrawRequestDTO request = new AccountWithdrawRequestDTO();
        request.setPassword(password);
        request.setAgreed(true);
        request.setReason(reason);
        request.setReasonDetail(reasonDetail);
        return request;
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
