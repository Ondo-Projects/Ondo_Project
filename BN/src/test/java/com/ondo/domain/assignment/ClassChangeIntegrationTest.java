package com.ondo.domain.assignment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.assignment.dto.ClassReleaseResponseDTO;
import com.ondo.domain.assignment.dto.ClassStudentResponseDTO;
import com.ondo.domain.assignment.service.AssignmentService;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.counseling.service.CounselingService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.util.JwtProvider;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class ClassChangeIntegrationTest {

    private static final String OLD_TEACHER = "it-cls-old-teacher";
    private static final String NEW_TEACHER = "it-cls-new-teacher";
    private static final String OTHER_SCHOOL_TEACHER = "it-cls-far-teacher";
    private static final String STUDENT = "it-cls-student";
    private static final String STUDENT2 = "it-cls-student2";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtProvider jwtProvider;
    @Autowired private AssignmentService assignmentService;
    @Autowired private CounselingService counselingService;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StudentTeacherAssignmentRepository assignmentRepository;
    @Autowired private CounselingPostRepository counselingPostRepository;

    @PersistenceContext
    private EntityManager em;

    private User oldTeacher;
    private User newTeacher;
    private User student;

    @BeforeEach
    void setUp() {
        School school = school("ITCLS001", "학급변경테스트중학교");
        School otherSchool = school("ITCLS002", "다른학교중학교");
        oldTeacher = saveUser(OLD_TEACHER, Role.TEACHER, "작년담임", school);
        newTeacher = saveUser(NEW_TEACHER, Role.TEACHER, "올해담임", school);
        saveUser(OTHER_SCHOOL_TEACHER, Role.TEACHER, "다른학교담임", otherSchool);
        student = saveUser(STUDENT, Role.STUDENT, "학생", school);
        link(oldTeacher, student);
    }

    @Test
    void studentChangesTeacher_cancelsOpenCounselingToOldTeacher() {
        CounselingPost waiting = counseling(student, oldTeacher, CounselingStatus.WAITING);
        CounselingPost confirmed = counseling(student, oldTeacher, CounselingStatus.CONFIRMED);
        CounselingPost completed = counseling(student, oldTeacher, CounselingStatus.COMPLETED);

        AssignmentResponseDTO result = assignmentService.changeAssignment(STUDENT, code(NEW_TEACHER));
        em.flush();
        em.clear();

        assertThat(result.getTeacherUsername()).isEqualTo(NEW_TEACHER);
        assertThat(currentTeacherOf(STUDENT)).isEqualTo(NEW_TEACHER);
        assertThat(statusOf(waiting)).isEqualTo(CounselingStatus.CANCELLED);
        assertThat(statusOf(confirmed)).isEqualTo(CounselingStatus.CANCELLED);
        assertThat(statusOf(completed)).isEqualTo(CounselingStatus.COMPLETED);
    }

    @Test
    void newTeacher_cannotSeeCounselingSentToOldTeacher() {
        counseling(student, oldTeacher, CounselingStatus.COMPLETED);

        assignmentService.changeAssignment(STUDENT, code(NEW_TEACHER));
        em.flush();
        em.clear();
        CounselingPost mine = counseling(userRepository.findByUsername(STUDENT).orElseThrow(), newTeacherRef(), CounselingStatus.WAITING);
        em.flush();

        assertThat(counselingService.getTeacherPosts(NEW_TEACHER, null))
                .extracting(item -> item.getId())
                .containsExactly(mine.getId());
        assertThat(counselingService.getTeacherUnreadCount(NEW_TEACHER)).isEqualTo(1);
        // 연결이 끊긴 작년 담임도 더는 이 학생의 상담을 보지 않습니다.
        assertThat(counselingService.getTeacherPosts(OLD_TEACHER, null)).isEmpty();
    }

    @Test
    void change_rejectsSameTeacherOtherSchoolAndUnlinkedStudent() {
        assertThatThrownBy(() -> assignmentService.changeAssignment(STUDENT, code(OLD_TEACHER)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("이미 이 선생님과 연결돼 있어요.");

        assertThatThrownBy(() -> assignmentService.changeAssignment(STUDENT, code(OTHER_SCHOOL_TEACHER)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("같은 학교 교사만 담당 교사로 등록할 수 있습니다.");

        saveUser(STUDENT2, Role.STUDENT, "미연결학생", student.getSchool());
        assertThatThrownBy(() -> assignmentService.changeAssignment(STUDENT2, code(NEW_TEACHER)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("연결된 담임 선생님이 없어요");

        assertThat(currentTeacherOf(STUDENT)).isEqualTo(OLD_TEACHER);
    }

    @Test
    void teacherReleasesOneStudent() {
        CounselingPost waiting = counseling(student, oldTeacher, CounselingStatus.WAITING);

        ClassReleaseResponseDTO result = assignmentService.releaseStudent(OLD_TEACHER, STUDENT);
        em.flush();
        em.clear();

        assertThat(result.getReleasedStudents()).isEqualTo(1);
        assertThat(result.getCancelledCounselings()).isEqualTo(1);
        assertThat(assignmentRepository.findByStudent(userRepository.findByUsername(STUDENT).orElseThrow())).isEmpty();
        assertThat(statusOf(waiting)).isEqualTo(CounselingStatus.CANCELLED);
    }

    @Test
    void teacherCannotReleaseOtherTeachersStudent() {
        assertThatThrownBy(() -> assignmentService.releaseStudent(NEW_TEACHER, STUDENT))
                .isInstanceOf(BusinessException.class)
                .hasMessage("우리 반에 연결된 학생이 아닙니다.");
        assertThat(currentTeacherOf(STUDENT)).isEqualTo(OLD_TEACHER);
    }

    @Test
    void teacherReleasesWholeClass_andGetsNewInviteCode() {
        User student2 = saveUser(STUDENT2, Role.STUDENT, "학생2", student.getSchool());
        link(oldTeacher, student2);
        counseling(student2, oldTeacher, CounselingStatus.WAITING);
        String oldCode = assignmentService.getOrCreateInviteCode(OLD_TEACHER).getCode();

        ClassReleaseResponseDTO result = assignmentService.releaseClass(OLD_TEACHER);
        em.flush();
        em.clear();

        assertThat(result.getReleasedStudents()).isEqualTo(2);
        assertThat(result.getCancelledCounselings()).isEqualTo(1);
        assertThat(result.getNewInviteCode()).matches("\\d{6}").isNotEqualTo(oldCode);
        assertThat(assignmentService.getClassStudents(OLD_TEACHER)).isEmpty();

        // 지난 코드로는 다시 연결할 수 없음
        AssignmentRequestDTO oldCodeRequest = new AssignmentRequestDTO();
        oldCodeRequest.setInviteCode(oldCode);
        assertThatThrownBy(() -> assignmentService.registerAssignment(STUDENT, oldCodeRequest))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void classStudents_listsOnlyOwnStudents() {
        User student2 = saveUser(STUDENT2, Role.STUDENT, "학생2", student.getSchool());
        link(newTeacher, student2);

        List<ClassStudentResponseDTO> students = assignmentService.getClassStudents(OLD_TEACHER);

        assertThat(students).extracting(ClassStudentResponseDTO::getStudentUsername).containsExactly(STUDENT);
    }

    @Test
    void api_changeAndRelease() throws Exception {
        AssignmentRequestDTO request = code(NEW_TEACHER);

        mockMvc.perform(put("/api/student/assignment")
                        .header("Authorization", bearer(STUDENT, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teacherUsername").value(NEW_TEACHER));

        mockMvc.perform(get("/api/teacher/class/students").header("Authorization", bearer(NEW_TEACHER, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].studentUsername").value(STUDENT));

        mockMvc.perform(delete("/api/teacher/class/students/" + STUDENT)
                        .header("Authorization", bearer(NEW_TEACHER, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.releasedStudents").value(1));

        mockMvc.perform(post("/api/teacher/class/release").header("Authorization", bearer(STUDENT, Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    private School school(String code, String name) {
        return schoolRepository.save(School.builder()
                .schoolCode(code)
                .schoolName(name)
                .region("서울")
                .schoolType("중학교")
                .build());
    }

    private User saveUser(String username, Role role, String name, School school) {
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

    private void link(User teacher, User target) {
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher).student(target).assignedAt(LocalDateTime.now()).build());
    }

    private CounselingPost counseling(User owner, User teacher, CounselingStatus status) {
        return counselingPostRepository.save(CounselingPost.builder()
                .student(owner)
                .teacher(teacher)
                .title("상담")
                .content("내용")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.CAREER)
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private AssignmentRequestDTO code(String teacherUsername) {
        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setInviteCode(assignmentService.getOrCreateInviteCode(teacherUsername).getCode());
        return request;
    }

    private User newTeacherRef() {
        return userRepository.findByUsername(NEW_TEACHER).orElseThrow();
    }

    private String currentTeacherOf(String username) {
        User target = userRepository.findByUsername(username).orElseThrow();
        return assignmentRepository.findByStudent(target).orElseThrow().getTeacher().getUsername();
    }

    private CounselingStatus statusOf(CounselingPost post) {
        return counselingPostRepository.findById(post.getId()).orElseThrow().getStatus();
    }

    private String bearer(String username, Role role) {
        return "Bearer " + jwtProvider.createAccessToken(username, role);
    }
}
