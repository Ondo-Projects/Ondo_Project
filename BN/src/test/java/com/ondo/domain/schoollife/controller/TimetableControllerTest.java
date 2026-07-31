package com.ondo.domain.schoollife.controller;

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
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true"
})
@AutoConfigureMockMvc
@Transactional
class TimetableControllerTest {

    private static final String STUDENT_USERNAME = "it-timetable-student";
    private static final String STUDENT_NO_CLASS_USERNAME = "it-timetable-student-empty";

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
                .schoolCode("ITTT001")
                .schoolName("시간표통합테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("시간표학생")
                .grade(2)
                .classNumber(3)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_NO_CLASS_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("시간표미입력학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getTodayTimetable_returnsSamplePeriods() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/timetable/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.grade").value(2))
                .andExpect(jsonPath("$.classNumber").value(3))
                .andExpect(jsonPath("$.periods.length()").value(4));
    }

    @Test
    void getTodayTimetable_profileIncomplete_whenClassMissing() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_NO_CLASS_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/timetable/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROFILE_INCOMPLETE"))
                .andExpect(jsonPath("$.message").value("학년·반을 입력하면 시간표를 볼 수 있습니다."));
    }
}
