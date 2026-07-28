package com.ondo.domain.admin;

import com.ondo.domain.counseling.entity.CounselingAccessLog;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingAccessLogRepository;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.precounseling.entity.PreCounselingProfileAccessLog;
import com.ondo.domain.precounseling.repository.PreCounselingProfileAccessLogRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class AdminIntegrationTest {

    private static final String SCHOOL_CODE = "ADM_T001";
    private static final String OTHER_SCHOOL_CODE = "ADM_T002";
    private static final String ADMIN_USERNAME = "admin-it";
    private static final String TEACHER_USERNAME = "teacher-it";
    private static final String STUDENT_USERNAME = "student-it";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CounselingPostRepository counselingPostRepository;

    @Autowired
    private CounselingAccessLogRepository counselingAccessLogRepository;

    @Autowired
    private PreCounselingProfileAccessLogRepository preCounselingProfileAccessLogRepository;

    @Autowired
    private StudentTeacherAssignmentRepository assignmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School school;
    private User admin;
    private User teacher;
    private User student;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("관리자테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());
        school.updateNeisCodes("B10", "7010569");

        schoolRepository.save(School.builder()
                .schoolCode(OTHER_SCHOOL_CODE)
                .schoolName("관리자테스트고등학교")
                .region("서울특별시 서초구")
                .schoolType("고")
                .build());

        admin = saveUser(ADMIN_USERNAME, Role.ADMIN, "관리자");
        teacher = saveUser(TEACHER_USERNAME, Role.TEACHER, "담당교사");
        student = saveUser(STUDENT_USERNAME, Role.STUDENT, "테스트학생");

        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher)
                .student(student)
                .assignedAt(LocalDateTime.now())
                .build());

        CounselingPost post = counselingPostRepository.save(CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title("관리자 테스트 상담")
                .content("민감 내용")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.EMOTIONAL)
                .status(CounselingStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        counselingAccessLogRepository.save(CounselingAccessLog.builder()
                .counselingPost(post)
                .teacher(teacher)
                .accessedAt(LocalDateTime.now())
                .build());

        preCounselingProfileAccessLogRepository.save(PreCounselingProfileAccessLog.builder()
                .student(student)
                .teacher(teacher)
                .accessedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void dashboard_returnsSummaryForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.studentCount").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.teacherCount").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.adminCount").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.counselingAccessLogsToday").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.preCounselAccessLogsToday").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void users_searchReturnsFilteredResults() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .param("keyword", STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].username").value(STUDENT_USERNAME))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void schools_searchReturnsNeisMappedSchool() throws Exception {
        mockMvc.perform(get("/api/admin/schools")
                        .param("mapped", "true")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].schoolCode").value(SCHOOL_CODE))
                .andExpect(jsonPath("$.items[0].neisMapped").value(true));
    }

    @Test
    void counselingAccessLogs_returnsAuditEntriesWithoutContent() throws Exception {
        mockMvc.perform(get("/api/admin/access-logs/counseling")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].counselingTitle").value("관리자 테스트 상담"))
                .andExpect(jsonPath("$.items[0].teacherUsername").value(TEACHER_USERNAME))
                .andExpect(jsonPath("$.items[0].content").doesNotExist());
    }

    @Test
    void adminEndpoints_returnForbiddenForStudent() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void systemStatus_returnsConfigurationFlagsWithoutSecrets() throws Exception {
        mockMvc.perform(get("/api/admin/system-status")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.neisDevMode").isBoolean())
                .andExpect(jsonPath("$.neisApiKeyConfigured").isBoolean())
                .andExpect(jsonPath("$.weatherDevMode").isBoolean())
                .andExpect(jsonPath("$.weatherApiKeyConfigured").isBoolean())
                .andExpect(jsonPath("$.encryptionDevMode").isBoolean())
                .andExpect(jsonPath("$.encryptionKeyConfigured").isBoolean());
    }

    @Test
    void statistics_returnsCounselingStatusAndMoodCounts() throws Exception {
        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counselingByStatus.WAITING").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.moodByLevelLast7Days.SUNNY").exists());
    }

    @Test
    void updateUserStatus_deactivatesStudentAndBlocksJwt() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{username}/status", STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(STUDENT_USERNAME))
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("비활성화되었거나 존재하지 않는 계정입니다."));
    }

    @Test
    void updateUserStatus_rejectsSelfDeactivation() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{username}/status", ADMIN_USERNAME)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("본인 계정 상태는 변경할 수 없습니다."));
    }

    @Test
    void changeUserSchool_movesStudentAndClearsAssignment() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{username}/school", STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"schoolCode\":\"" + OTHER_SCHOOL_CODE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value(OTHER_SCHOOL_CODE));

        assertThat(assignmentRepository.findByStudent(student)).isEmpty();
    }

    @Test
    void activityLogs_recordsAdminActions() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{username}/status", STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/activity-logs")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].action").value("USER_DEACTIVATE"))
                .andExpect(jsonPath("$.items[0].targetUsername").value(STUDENT_USERNAME))
                .andExpect(jsonPath("$.items[0].adminUsername").value(ADMIN_USERNAME));
    }

    private User saveUser(String username, Role role, String name) {
        return userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .school(school)
                .name(name)
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
