package com.ondo.domain.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.dto.SignUpRequestDTO;
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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
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
class SignUpApiIntegrationTest {

    private static final String SCHOOL_CODE = "SIGNUP_API001";
    private static final String TEACHER_EMAIL = "signup-api-teacher@korea.kr";
    private static final String STUDENT_EMAIL = "signup-api-student@test.com";

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
                .schoolName("SignupAPI테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username("existing-user")
                .password(passwordEncoder.encode("password1!"))
                .role(Role.STUDENT)
                .school(schoolRepository.findById(SCHOOL_CODE).orElseThrow())
                .name("기존사용자")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void signup_createsTeacherAccount() throws Exception {
        seedVerifiedEmail(TEACHER_EMAIL);

        SignUpRequestDTO request = teacherRequest("api-teacher-01");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("api-teacher-01"))
                .andExpect(jsonPath("$.role").value("TEACHER"))
                .andExpect(jsonPath("$.message").value("회원가입이 완료되었습니다."));

        assertThat(userRepository.existsByUsername("api-teacher-01")).isTrue();
    }

    @Test
    void signup_createsTeacherAccountWithRegionalEduDomain() throws Exception {
        String email = "signup-api-teacher@sen.go.kr";
        seedVerifiedEmail(email);

        SignUpRequestDTO request = teacherRequest("api-teacher-seoul");
        request.setEmail(email);

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("api-teacher-seoul"))
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void signup_rejectsTeacherWithNonOfficialEmail() throws Exception {
        mockMvc.perform(post("/api/auth/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"teacher@gmail.com","role":"TEACHER"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "교사 가입은 시·도교육청 공직 메일(@sen.go.kr, @goe.go.kr 등) 또는 @korea.kr만 사용할 수 있습니다."
                ));
    }

    @Test
    void signup_createsStudentAccountWhenOver14() throws Exception {
        seedVerifiedEmail(STUDENT_EMAIL);

        SignUpRequestDTO request = studentRequest("api-student-01");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("api-student-01"))
                .andExpect(jsonPath("$.role").value("STUDENT"));

        assertThat(userRepository.existsByUsername("api-student-01")).isTrue();
    }

    @Test
    void signup_rejectsDuplicateUsername() throws Exception {
        seedVerifiedEmail(STUDENT_EMAIL);

        SignUpRequestDTO request = studentRequest("existing-user");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 사용 중인 아이디입니다."));
    }

    @Test
    void signup_rejectsAdminRole() throws Exception {
        SignUpRequestDTO request = teacherRequest("api-admin-attempt");
        request.setRole(Role.ADMIN);

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("관리자 계정은 회원가입으로 생성할 수 없습니다."));
    }

    @Test
    void signup_rejectsPasswordMismatch() throws Exception {
        seedVerifiedEmail(TEACHER_EMAIL);

        SignUpRequestDTO request = teacherRequest("api-password-mismatch");
        request.setPasswordConfirm("different1!");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("비밀번호와 비밀번호 확인이 일치하지 않습니다."));
    }

    @Test
    void signup_rejectsUnverifiedEmail() throws Exception {
        SignUpRequestDTO request = teacherRequest("api-unverified-email");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이메일 인증을 완료해 주세요."));
    }

    private SignUpRequestDTO teacherRequest(String username) {
        SignUpRequestDTO request = new SignUpRequestDTO();
        request.setRole(Role.TEACHER);
        request.setSchoolCode(SCHOOL_CODE);
        request.setName("김교사");
        request.setUsername(username);
        request.setPassword("password1!");
        request.setPasswordConfirm("password1!");
        request.setEmail(TEACHER_EMAIL);
        request.setAgreeService(true);
        request.setAgreePrivacy(true);
        request.setAgreeSensitive(true);
        return request;
    }

    private SignUpRequestDTO studentRequest(String username) {
        SignUpRequestDTO request = new SignUpRequestDTO();
        request.setRole(Role.STUDENT);
        request.setSchoolCode(SCHOOL_CODE);
        request.setName("이학생");
        request.setBirthDate(LocalDate.of(2010, 5, 1));
        request.setUsername(username);
        request.setPassword("password1!");
        request.setPasswordConfirm("password1!");
        request.setEmail(STUDENT_EMAIL);
        request.setAgreeService(true);
        request.setAgreePrivacy(true);
        request.setAgreeSensitive(true);
        return request;
    }

    private void seedVerifiedEmail(String email) {
        redisTemplate.opsForValue().set(
                "email:verified:" + email.trim().toLowerCase(),
                "true",
                Duration.ofMinutes(30)
        );
    }
}
