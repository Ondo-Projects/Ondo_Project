package com.ondo.domain.admin;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.neis.api-key=test-neis-api-key"
})
@AutoConfigureMockMvc
@Transactional
class AdminNeisSyncDevModeIntegrationTest {

    private static final String ADMIN_USERNAME = "admin-neis-dev";

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
                .schoolCode("NEIS_DEV_T1")
                .schoolName("dev모드테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(ADMIN_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.ADMIN)
                .school(school)
                .name("dev관리자")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void syncNeisSchoolCodes_rejectsDevMode() throws Exception {
        mockMvc.perform(post("/api/admin/schools/sync-neis")
                        .header("Authorization", "Bearer " + jwtProvider.createAccessToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("dev-mode")));
    }
}
