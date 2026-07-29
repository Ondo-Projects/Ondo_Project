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
class CommonSchoolScheduleControllerTest {

    private static final String STUDENT_USERNAME = "it-common-schedule-student";
    private static final String TEACHER_USERNAME = "it-common-schedule-teacher";

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
                .schoolCode("ITCS001")
                .schoolName("공통학사일정테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("공통학사일정학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.TEACHER)
                .school(school)
                .name("공통학사일정교사")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getUpcomingSchedule_returnsSampleEventsForStudent() throws Exception {
        String token = jwtProvider.createAccessToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/common/school-schedule/upcoming")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.schoolName").value("공통학사일정테스트중학교"))
                .andExpect(jsonPath("$.events.length()").value(3));
    }

    @Test
    void getUpcomingSchedule_returnsSampleEventsForTeacher() throws Exception {
        String token = jwtProvider.createAccessToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/common/school-schedule/upcoming?days=7")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.events[0].eventName").value("학교 행사"));
    }
}
