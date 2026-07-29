package com.ondo.domain.meal;

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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.neis.dev-mode=false"
})
@TestPropertySource(locations = "file:config/application-local.properties")
@AutoConfigureMockMvc
class NeisMappingRollbackIntegrationTest {

    private static final String STUDENT_USERNAME = "it-neis-rollback-student";

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
        userRepository.findById(STUDENT_USERNAME).ifPresent(userRepository::delete);
        schoolRepository.findById("ITRB001").ifPresent(schoolRepository::delete);

        School school = schoolRepository.save(School.builder()
                .schoolCode("ITRB001")
                .schoolName("NEIS매핑없는가상중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("롤백테스트")
                .grade(2)
                .classNumber(3)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getTodayMeals_whenNeisMappingFails_returnsMappingFailedNot500() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/meals/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAPPING_FAILED"));
    }

    @Test
    void getUpcomingSchedule_whenNeisMappingFails_returnsMappingFailedNot500() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/common/school-schedule/upcoming?days=14")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAPPING_FAILED"));
    }

    @Test
    void getTodayTimetable_whenNeisMappingFails_returnsMappingFailedNot500() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/timetable/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAPPING_FAILED"));
    }
}
