package com.ondo.domain.attention;

import com.ondo.domain.attention.dto.AttentionReasonCode;
import com.ondo.domain.attention.dto.StudentAttentionResponseDTO;
import com.ondo.domain.attention.service.StudentAttentionService;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.weather.dev-mode=true",
        "ondo.retention.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class StudentAttentionIntegrationTest {

    private static final String TEACHER = "it-att-teacher";
    private static final String OTHER_TEACHER = "it-att-teacher-other";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtProvider jwtProvider;
    @Autowired private StudentAttentionService attentionService;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StudentTeacherAssignmentRepository assignmentRepository;
    @Autowired private MoodRecordRepository moodRecordRepository;
    @Autowired private CounselingPostRepository counselingPostRepository;

    private final LocalDate today = LocalDate.now();
    private School school;
    private User teacher;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode("ITATT001")
                .schoolName("살펴보기테스트중학교")
                .region("서울")
                .schoolType("중학교")
                .build());
        teacher = saveUser(TEACHER, Role.TEACHER, "담임");
    }

    @Test
    void stormyToday_isUrgent() {
        User student = assignedStudent("it-att-stormy", "힘든학생");
        mood(student, today, MoodLevel.STORMY);

        List<StudentAttentionResponseDTO> result = attentionService.getForTeacher(TEACHER, today);

        StudentAttentionResponseDTO item = find(result, "it-att-stormy");
        assertThat(item.isUrgent()).isTrue();
        assertThat(codes(item)).containsExactly(AttentionReasonCode.STORMY_TODAY);
    }

    @Test
    void lowMoodThreeTimesInWeek_isFlaggedButNotUrgent() {
        User student = assignedStudent("it-att-low", "우울학생");
        mood(student, today.minusDays(6), MoodLevel.RAINY);
        mood(student, today.minusDays(3), MoodLevel.STORMY);
        mood(student, today.minusDays(1), MoodLevel.RAINY);
        mood(student, today, MoodLevel.FAIR);

        StudentAttentionResponseDTO item = find(attentionService.getForTeacher(TEACHER, today), "it-att-low");

        assertThat(item.isUrgent()).isFalse();
        assertThat(codes(item)).containsExactly(AttentionReasonCode.LOW_MOOD_REPEATED);
        assertThat(item.getReasons().get(0).getMessage()).contains("7일 중 3일");
    }

    @Test
    void lowMoodOutsideWindowOrBelowThreshold_isNotFlagged() {
        User student = assignedStudent("it-att-ok", "괜찮은학생");
        mood(student, today.minusDays(7), MoodLevel.STORMY); // 7일 범위 밖
        mood(student, today.minusDays(2), MoodLevel.RAINY);
        mood(student, today.minusDays(1), MoodLevel.RAINY);

        assertThat(attentionService.getForTeacher(TEACHER, today))
                .extracting(StudentAttentionResponseDTO::getStudentUsername)
                .doesNotContain("it-att-ok");
    }

    @Test
    void openSchoolViolenceCounseling_isUrgentWithPostId() {
        User student = assignedStudent("it-att-violence", "폭력상담학생");
        CounselingPost open = post(student, CounselingType.SCHOOL_VIOLENCE, CounselingStatus.WAITING);
        post(student, CounselingType.SCHOOL_VIOLENCE, CounselingStatus.COMPLETED);
        post(student, CounselingType.CAREER, CounselingStatus.WAITING);

        StudentAttentionResponseDTO item = find(attentionService.getForTeacher(TEACHER, today), "it-att-violence");

        assertThat(item.isUrgent()).isTrue();
        assertThat(item.getReasons()).hasSize(1);
        assertThat(item.getReasons().get(0).getCode()).isEqualTo(AttentionReasonCode.SCHOOL_VIOLENCE_OPEN);
        assertThat(item.getReasons().get(0).getCounselingPostId()).isEqualTo(open.getId());
    }

    @Test
    void onlyOwnStudents_andUrgentFirst() {
        User urgentStudent = assignedStudent("it-att-a", "가학생");
        mood(urgentStudent, today, MoodLevel.STORMY);
        User lowStudent = assignedStudent("it-att-b", "나학생");
        mood(lowStudent, today.minusDays(2), MoodLevel.RAINY);
        mood(lowStudent, today.minusDays(1), MoodLevel.RAINY);
        mood(lowStudent, today.minusDays(4), MoodLevel.RAINY);

        User otherTeacher = saveUser(OTHER_TEACHER, Role.TEACHER, "다른담임");
        User otherStudent = saveUser("it-att-other", Role.STUDENT, "다른반학생");
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(otherTeacher).student(otherStudent).assignedAt(LocalDateTime.now()).build());
        mood(otherStudent, today, MoodLevel.STORMY);

        List<StudentAttentionResponseDTO> result = attentionService.getForTeacher(TEACHER, today);

        assertThat(result).extracting(StudentAttentionResponseDTO::getStudentUsername)
                .containsSubsequence("it-att-a", "it-att-b")
                .doesNotContain("it-att-other");
    }

    @Test
    void api_teacherOnly() throws Exception {
        User student = assignedStudent("it-att-api", "API학생");
        mood(student, today, MoodLevel.STORMY);

        mockMvc.perform(get("/api/teacher/attention")
                        .header("Authorization", "Bearer " + jwtProvider.createAccessToken(TEACHER, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].studentUsername").value("it-att-api"))
                .andExpect(jsonPath("$[0].urgent").value(true))
                .andExpect(jsonPath("$[0].reasons[0].code").value("STORMY_TODAY"));

        mockMvc.perform(get("/api/teacher/attention")
                        .header("Authorization", "Bearer " + jwtProvider.createAccessToken("it-att-api", Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    private User assignedStudent(String username, String name) {
        User student = saveUser(username, Role.STUDENT, name);
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher).student(student).assignedAt(LocalDateTime.now()).build());
        return student;
    }

    private User saveUser(String username, Role role, String name) {
        return userRepository.save(User.builder()
                .username(username)
                .password("encoded")
                .role(role)
                .school(school)
                .name(name)
                .email(role == Role.TEACHER ? username + "@korea.kr" : null)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    private void mood(User student, LocalDate date, MoodLevel level) {
        moodRecordRepository.save(MoodRecord.builder()
                .student(student)
                .moodLevel(level)
                .recordedDate(date)
                .createdAt(date.atStartOfDay())
                .updatedAt(date.atStartOfDay())
                .build());
    }

    private CounselingPost post(User student, CounselingType type, CounselingStatus status) {
        return counselingPostRepository.save(CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title("상담")
                .content("내용")
                .desiredDate(today.plusDays(1))
                .counselingType(type)
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private StudentAttentionResponseDTO find(List<StudentAttentionResponseDTO> result, String username) {
        return result.stream()
                .filter(item -> item.getStudentUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new AssertionError(username + " 가 목록에 없습니다: " + result));
    }

    private List<AttentionReasonCode> codes(StudentAttentionResponseDTO item) {
        return item.getReasons().stream().map(reason -> reason.getCode()).toList();
    }
}
