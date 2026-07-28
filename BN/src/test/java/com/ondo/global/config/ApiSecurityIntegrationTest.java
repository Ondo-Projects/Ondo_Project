package com.ondo.global.config;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.util.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class ApiSecurityIntegrationTest {

    private static final String SCHOOL_CODE = "SEC_T001";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("보안테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        saveUser("student01", Role.STUDENT, school);
        saveUser("teacher01", Role.TEACHER, school);
    }

    private void saveUser(String username, Role role, School school) {
        if (userRepository.existsByUsername(username)) {
            return;
        }
        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .school(school)
                .name(username)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void teacherHealth_returnsForbiddenForStudentToken() throws Exception {
        String token = jwtProvider.createAccessToken("student01", Role.STUDENT);

        mockMvc.perform(get("/api/teacher/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void teacherHealth_returnsOkForTeacherToken() throws Exception {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);

        mockMvc.perform(get("/api/teacher/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("teacher ok"));
    }

    @Test
    void studentHealth_returnsOkForStudentToken() throws Exception {
        String token = jwtProvider.createAccessToken("student01", Role.STUDENT);

        mockMvc.perform(get("/api/student/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("student ok"));
    }

    @Test
    void studentHealth_returnsForbiddenForTeacherToken() throws Exception {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);

        mockMvc.perform(get("/api/student/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void schoolSearch_remainsPublic() throws Exception {
        mockMvc.perform(get("/api/schools/search").param("keyword", "서울"))
                .andExpect(status().isOk());
    }

    @Test
    void adminDashboard_returnsForbiddenForTeacherToken() throws Exception {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }
}
