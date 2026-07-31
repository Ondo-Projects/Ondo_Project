package com.ondo.domain.profile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.profile.dto.SchoolChangeRequestDTO;
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
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.weather.dev-mode=true"
})
@AutoConfigureMockMvc
@Transactional
class ProfileSchoolIntegrationTest {

    private static final String SCHOOL_A = "ITPSA001";
    private static final String SCHOOL_B = "ITPSB001";
    private static final String STUDENT_USERNAME = "it-profile-student";
    private static final String TEACHER_USERNAME = "it-profile-teacher";

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
    private StudentTeacherAssignmentRepository assignmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School schoolA;
    private School schoolB;

    @BeforeEach
    void setUp() {
        schoolA = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_A)
                .schoolName("프로필A중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());
        schoolB = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_B)
                .schoolName("프로필B중학교")
                .region("서울특별시 서초구")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(STUDENT_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(schoolA)
                .name("프로필학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.TEACHER)
                .school(schoolA)
                .name("프로필교사")
                .email("teacher@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void studentChangeSchool_removesAssignment() throws Exception {
        User student = userRepository.findByUsername(STUDENT_USERNAME).orElseThrow();
        User teacher = userRepository.findByUsername(TEACHER_USERNAME).orElseThrow();
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .student(student)
                .teacher(teacher)
                .assignedAt(LocalDateTime.now())
                .build());

        SchoolChangeRequestDTO request = new SchoolChangeRequestDTO();
        request.setSchoolCode(SCHOOL_B);

        mockMvc.perform(patch("/api/student/profile/school")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value(SCHOOL_B))
                .andExpect(jsonPath("$.message").value("학교가 변경되었습니다. 새 학교 교사의 초대 코드로 담당 교사를 다시 등록해 주세요."));

        assertThat(assignmentRepository.findByStudent(student)).isEmpty();
        assertThat(userRepository.findByUsername(STUDENT_USERNAME).orElseThrow().getSchool().getSchoolCode())
                .isEqualTo(SCHOOL_B);
    }

    @Test
    void teacherChangeSchool_removesStudentAssignments() throws Exception {
        User student = userRepository.findByUsername(STUDENT_USERNAME).orElseThrow();
        User teacher = userRepository.findByUsername(TEACHER_USERNAME).orElseThrow();
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .student(student)
                .teacher(teacher)
                .assignedAt(LocalDateTime.now())
                .build());

        SchoolChangeRequestDTO request = new SchoolChangeRequestDTO();
        request.setSchoolCode(SCHOOL_B);

        mockMvc.perform(patch("/api/teacher/profile/school")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value(SCHOOL_B))
                .andExpect(jsonPath("$.message").value("학교가 변경되었습니다. 기존 담당 학생 연결이 해제되었습니다."));

        assertThat(assignmentRepository.findByTeacher(teacher)).isEmpty();
        assertThat(userRepository.findByUsername(TEACHER_USERNAME).orElseThrow().getSchool().getSchoolCode())
                .isEqualTo(SCHOOL_B);
    }

    @Test
    void getMySchool_returnsCurrentSchool() throws Exception {
        mockMvc.perform(get("/api/student/profile/school")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value(SCHOOL_A))
                .andExpect(jsonPath("$.schoolName").value("프로필A중학교"));
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
