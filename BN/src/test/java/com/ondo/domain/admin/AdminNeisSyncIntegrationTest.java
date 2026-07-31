package com.ondo.domain.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.admin.repository.AdminActivityLogRepository;
import com.ondo.domain.meal.client.NeisApiClient;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=false",
        "ondo.neis.api-key=test-neis-api-key"
})
@AutoConfigureMockMvc
@Transactional
class AdminNeisSyncIntegrationTest {

    private static final String UNMAPPED_SCHOOL_CODE = "NEIS_T001";
    private static final String ADMIN_USERNAME = "admin-neis-sync";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminActivityLogRepository adminActivityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private NeisApiClient neisApiClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        School school = schoolRepository.save(School.builder()
                .schoolCode(UNMAPPED_SCHOOL_CODE)
                .schoolName("000NEIS매핑테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(ADMIN_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.ADMIN)
                .school(school)
                .name("NEIS관리자")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        when(neisApiClient.searchSchoolForMapping(any(School.class)))
                .thenAnswer(invocation -> {
                    School target = invocation.getArgument(0);
                    String json = """
                            [
                              {
                                "SCHUL_NM": "%s",
                                "SCHUL_KND_SC_NM": "중학교",
                                "ATPT_OFCDC_SC_CODE": "B10",
                                "SD_SCHUL_CODE": "7130999",
                                "ORG_RDNMA": "%s"
                              }
                            ]
                            """.formatted(target.getSchoolName(), target.getRegion());
                    return objectMapper.readTree(json);
                });
    }

    @Test
    void syncNeisSchoolCodes_mapsUnmappedSchools() throws Exception {
        mockMvc.perform(post("/api/admin/schools/sync-neis")
                        .param("limit", "10")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processedCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.successCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("NEIS")));

        assertThat(adminActivityLogRepository.findAll()).anyMatch(log ->
                "SCHOOL_NEIS_SYNC".equals(log.getAction()));
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
