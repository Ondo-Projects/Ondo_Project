package com.ondo.domain.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.profile.dto.StudentClassProfileUpdateRequestDTO;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class StudentClassProfileIntegrationTest {

    private static final String SCHOOL_CODE = "ITCP001";
    private static final String STUDENT_USERNAME = "it-class-profile-student";
    private static final String TEACHER_USERNAME = "it-class-profile-teacher";

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
                .schoolName("학년반통합테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name("학년반학생")
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
                .name("학년반교사")
                .email("teacher@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getClassProfile_returnsEmptyProfile() throws Exception {
        mockMvc.perform(get("/api/student/profile/class")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void updateClassProfile_savesGradeAndClassNumber() throws Exception {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(2);
        request.setClassNumber(3);

        mockMvc.perform(patch("/api/student/profile/class")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.grade").value(2))
                .andExpect(jsonPath("$.classNumber").value(3))
                .andExpect(jsonPath("$.message").value("학년·반이 저장되었습니다."));

        User student = userRepository.findByUsername(STUDENT_USERNAME).orElseThrow();
        assertThat(student.getGrade()).isEqualTo(2);
        assertThat(student.getClassNumber()).isEqualTo(3);
    }

    @Test
    void updateClassProfile_teacherForbidden() throws Exception {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(1);
        request.setClassNumber(1);

        mockMvc.perform(patch("/api/student/profile/class")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void updateClassProfile_invalidGrade_returnsBadRequest() throws Exception {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(9);
        request.setClassNumber(1);

        mockMvc.perform(patch("/api/student/profile/class")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("학년은 1~3 사이로 입력해 주세요."));
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
