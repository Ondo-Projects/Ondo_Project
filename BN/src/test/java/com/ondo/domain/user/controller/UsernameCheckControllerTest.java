package com.ondo.domain.user.controller;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class UsernameCheckControllerTest {

    private static final String EXISTING_USERNAME = "it-username-check";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITUN001")
                .schoolName("아이디테스트학교")
                .region("서울")
                .schoolType("중학교")
                .build());

        userRepository.save(User.builder()
                .username(EXISTING_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void check_returnsAvailableForNewUsername() throws Exception {
        mockMvc.perform(get("/api/auth/username/check")
                        .param("username", "new_user01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.message").value("사용 가능한 아이디입니다."));
    }

    @Test
    void check_returnsUnavailableForExistingUsername() throws Exception {
        mockMvc.perform(get("/api/auth/username/check")
                        .param("username", EXISTING_USERNAME))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.message").value("이미 사용 중인 아이디입니다."));
    }

    @Test
    void check_returnsBadRequestForShortUsername() throws Exception {
        mockMvc.perform(get("/api/auth/username/check")
                        .param("username", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("아이디는 4~50자여야 합니다."));
    }
}
