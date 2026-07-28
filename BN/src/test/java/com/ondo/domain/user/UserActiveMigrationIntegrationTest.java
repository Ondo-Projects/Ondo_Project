package com.ondo.domain.user;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.user.legacy-active-fix.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class UserActiveMigrationIntegrationTest {

    private static final String SCHOOL_CODE = "UACT_T001";
    private static final String USERNAME = "legacy-user";

    @Autowired
    private MockMvc mockMvc;

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
                .schoolName("활성보정테스트중")
                .region("서울특별시")
                .schoolType("중")
                .build());

        User user = userRepository.save(User.builder()
                .username(USERNAME)
                .password(passwordEncoder.encode("password123"))
                .role(Role.STUDENT)
                .school(school)
                .name("레거시학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
        user.updateActive(false);
        userRepository.saveAndFlush(user);
    }

    @Test
    void activateAllInactive_restoresLoginForLegacyUsers() throws Exception {
        assertThat(userRepository.findByUsername(USERNAME).orElseThrow().isActive()).isFalse();

        int updated = userRepository.activateAllInactive();
        assertThat(updated).isEqualTo(1);
        assertThat(userRepository.findByUsername(USERNAME).orElseThrow().isActive()).isTrue();

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"username":"%s","password":"password123"}
                                """.formatted(USERNAME)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }
}
