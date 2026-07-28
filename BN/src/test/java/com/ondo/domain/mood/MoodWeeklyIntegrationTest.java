package com.ondo.domain.mood;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.mood.entity.MoodLevel;
import com.ondo.domain.mood.entity.MoodRecord;
import com.ondo.domain.mood.repository.MoodRecordRepository;
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

import java.time.LocalDate;
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
class MoodWeeklyIntegrationTest {

    private static final String TEACHER_USERNAME = "it-mood-weekly-teacher";
    private static final String STUDENT1_USERNAME = "it-mood-weekly-student1";
    private static final String STUDENT2_USERNAME = "it-mood-weekly-student2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentTeacherAssignmentRepository assignmentRepository;

    @Autowired
    private MoodRecordRepository moodRecordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User teacher;
    private User student1;
    private User student2;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITMW001")
                .schoolName("마음주간중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        teacher = saveUser(TEACHER_USERNAME, Role.TEACHER, "주간교사", school, "teacher@korea.kr");
        student1 = saveUser(STUDENT1_USERNAME, Role.STUDENT, "주간학생1", school, null);
        student2 = saveUser(STUDENT2_USERNAME, Role.STUDENT, "주간학생2", school, null);

        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher)
                .student(student1)
                .assignedAt(LocalDateTime.now())
                .build());
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher)
                .student(student2)
                .assignedAt(LocalDateTime.now())
                .build());

        LocalDate today = LocalDate.now();
        moodRecordRepository.save(MoodRecord.builder()
                .student(student1)
                .moodLevel(MoodLevel.SUNNY)
                .recordedDate(today)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        moodRecordRepository.save(MoodRecord.builder()
                .student(student1)
                .moodLevel(MoodLevel.RAINY)
                .recordedDate(today.minusDays(1))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void getWeeklyMood_returnsSevenDaySummary() throws Exception {
        mockMvc.perform(get("/api/teacher/mood/weekly")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords").value(2))
                .andExpect(jsonPath("$.students.length()").value(2))
                .andExpect(jsonPath("$.students[0].recordCount").value(2))
                .andExpect(jsonPath("$.students[0].dailyRecords.length()").value(7))
                .andExpect(jsonPath("$.moodCounts[0].code").value("SUNNY"))
                .andExpect(jsonPath("$.moodCounts[0].count").value(1))
                .andExpect(jsonPath("$.moodCounts[3].code").value("RAINY"))
                .andExpect(jsonPath("$.moodCounts[3].count").value(1));
    }

    @Test
    void getWeeklyMood_studentRole_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/teacher/mood/weekly")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT1_USERNAME, Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    private User saveUser(String username, Role role, String name, School school, String email) {
        return userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .school(school)
                .name(name)
                .email(email)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
