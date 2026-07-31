package com.ondo.domain.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.profile.dto.TeacherNotificationSettingsUpdateRequestDTO;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class TeacherNotificationSettingsIntegrationTest {

    private static final String SCHOOL_CODE = "ITNT001";
    private static final String TEACHER_USERNAME = "it-notify-teacher";
    private static final String STUDENT_USERNAME = "it-notify-student";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
                .schoolName("알림통합테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.TEACHER)
                .school(school)
                .name("알림교사")
                .email("notify-teacher@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("알림학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getNotificationSettings_returnsDefaultsForTeacher() throws Exception {
        mockMvc.perform(get("/api/teacher/profile/notification-settings")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").isEmpty())
                .andExpect(jsonPath("$.smsNotifyEnabled").value(false))
                .andExpect(jsonPath("$.ready").value(false));
    }

    @Test
    void updateNotificationSettings_savesPhoneAndConsent() throws Exception {
        TeacherNotificationSettingsUpdateRequestDTO request = new TeacherNotificationSettingsUpdateRequestDTO();
        request.setPhone("01077778888");
        request.setSmsNotifyEnabled(true);

        mockMvc.perform(put("/api/teacher/profile/notification-settings")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("01077778888"))
                .andExpect(jsonPath("$.smsNotifyEnabled").value(true))
                .andExpect(jsonPath("$.ready").value(true))
                .andExpect(jsonPath("$.message").value("상담 알림 설정이 저장되었습니다."));
    }

    @Test
    void updateNotificationSettings_rejectsStudentToken() throws Exception {
        TeacherNotificationSettingsUpdateRequestDTO request = new TeacherNotificationSettingsUpdateRequestDTO();
        request.setPhone("01077778888");
        request.setSmsNotifyEnabled(true);

        mockMvc.perform(put("/api/teacher/profile/notification-settings")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
