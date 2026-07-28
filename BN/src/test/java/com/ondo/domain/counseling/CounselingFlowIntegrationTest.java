package com.ondo.domain.counseling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.assignment.repository.TeacherInviteCodeRepository;
import com.ondo.domain.counseling.dto.CounselingCreateDTO;
import com.ondo.domain.counseling.dto.CounselingReplyDTO;
import com.ondo.domain.counseling.dto.CounselingStatusUpdateDTO;
import com.ondo.domain.counseling.dto.CounselingUpdateDTO;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.repository.CounselingAccessLogRepository;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class CounselingFlowIntegrationTest {

    private static final String SCHOOL_CODE = "ITCS001";
    private static final String TEACHER_USERNAME = "it-counsel-teacher";
    private static final String OTHER_TEACHER_USERNAME = "it-counsel-other-teacher";
    private static final String STUDENT1_USERNAME = "it-counsel-student1";
    private static final String STUDENT2_USERNAME = "it-counsel-student2";

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
    private CounselingAccessLogRepository counselingAccessLogRepository;

    @Autowired
    private CounselingPostRepository counselingPostRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School school;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("통합테스트중학교")
                .region("서울")
                .schoolType("중학교")
                .build());

        saveTeacher(TEACHER_USERNAME, "담당교사");
        saveTeacher(OTHER_TEACHER_USERNAME, "다른교사");
        saveStudent(STUDENT1_USERNAME, "학생1");
        saveStudent(STUDENT2_USERNAME, "학생2");
    }

    @Test
    void createCounseling_withoutAssignment_returnsBadRequest() throws Exception {
        String token = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(post("/api/counseling")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("담당 교사가 등록되지 않았습니다. 교사 초대 코드로 담당 교사를 등록해 주세요."));
    }

    @Test
    void assignmentAndCounselingFlow_success() throws Exception {
        String inviteCode = fetchInviteCode();
        registerAssignment(STUDENT1_USERNAME, inviteCode);

        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(post("/api/counseling")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("상담 제목"))
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.teacherUsername").value(TEACHER_USERNAME));
    }

    @Test
    void update_otherStudentPost_returnsBadRequest() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);

        CounselingUpdateDTO updateRequest = new CounselingUpdateDTO();
        updateRequest.setTitle("변조 시도");
        updateRequest.setContent("다른 학생이 수정");
        updateRequest.setDesiredDate(LocalDate.now().plusDays(2));
        updateRequest.setCounselingType(CounselingType.EMOTIONAL);

        String otherStudentToken = bearerToken(STUDENT2_USERNAME, Role.STUDENT);

        mockMvc.perform(put("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + otherStudentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("본인이 작성한 상담 사전 정보만 수정하거나 삭제할 수 있습니다."));
    }

    @Test
    void getPost_teacherMarksAsRead() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readByTeacherAt").isNotEmpty());
    }

    @Test
    void getPost_teacherCreatesAccessLogEachTime() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());

        var post = counselingPostRepository.findById(postId).orElseThrow();
        var teacher = userRepository.findByUsername(TEACHER_USERNAME).orElseThrow();
        assertThat(counselingAccessLogRepository.countByCounselingPostAndTeacher(post, teacher)).isEqualTo(2);
    }

    @Test
    void getPost_nonAssignedTeacher_returnsBadRequest() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String otherTeacherToken = bearerToken(OTHER_TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + otherTeacherToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void getTeacherPosts_studentRole_returnsBadRequest() throws Exception {
        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/counseling/teacher")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void updateStatus_waitingToConfirmed_success() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        CounselingStatusUpdateDTO statusRequest = new CounselingStatusUpdateDTO();
        statusRequest.setStatus(CounselingStatus.CONFIRMED);

        mockMvc.perform(patch("/api/counseling/{id}/status", postId)
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void delete_completedPost_returnsBadRequest() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);
        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        CounselingStatusUpdateDTO confirmRequest = new CounselingStatusUpdateDTO();
        confirmRequest.setStatus(CounselingStatus.CONFIRMED);
        mockMvc.perform(patch("/api/counseling/{id}/status", postId)
                .header("Authorization", "Bearer " + teacherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)));

        CounselingStatusUpdateDTO completeRequest = new CounselingStatusUpdateDTO();
        completeRequest.setStatus(CounselingStatus.COMPLETED);
        mockMvc.perform(patch("/api/counseling/{id}/status", postId)
                .header("Authorization", "Bearer " + teacherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completeRequest)));

        mockMvc.perform(delete("/api/counseling/{id}", postId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("대기 중인 상담 사전 정보만 수정하거나 삭제할 수 있습니다."));
    }

    @Test
    void reply_success() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        CounselingReplyDTO replyRequest = new CounselingReplyDTO();
        replyRequest.setReply("상담 답변입니다.");

        mockMvc.perform(post("/api/counseling/{id}/reply", postId)
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teacherReply").value("상담 답변입니다."))
                .andExpect(jsonPath("$.repliedAt").isNotEmpty());
    }

    @Test
    void getTeacherPosts_withStatusFilter_returnsWaitingOnly() throws Exception {
        Long firstPostId = createAssignedPost(STUDENT1_USERNAME);
        createAssignedPost(STUDENT2_USERNAME);

        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/counseling/teacher")
                        .header("Authorization", "Bearer " + teacherToken)
                        .param("status", "WAITING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        CounselingStatusUpdateDTO statusRequest = new CounselingStatusUpdateDTO();
        statusRequest.setStatus(CounselingStatus.CONFIRMED);
        mockMvc.perform(patch("/api/counseling/{id}/status", firstPostId)
                .header("Authorization", "Bearer " + teacherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest)));

        mockMvc.perform(get("/api/counseling/teacher")
                        .header("Authorization", "Bearer " + teacherToken)
                        .param("status", "WAITING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void registerAssignment_invalidInviteCode_returnsBadRequest() throws Exception {
        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setInviteCode("000000");

        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(post("/api/student/assignment")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유효하지 않은 초대 코드입니다."));
    }

    @Test
    void registerAssignment_duplicate_returnsBadRequest() throws Exception {
        String inviteCode = fetchInviteCode();
        registerAssignment(STUDENT1_USERNAME, inviteCode);

        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setInviteCode(inviteCode);

        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(post("/api/student/assignment")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 담당 교사가 등록되어 있습니다."));
    }

    @Test
    void getMyAssignment_withoutRegistration_returnsBadRequest() throws Exception {
        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/assignment")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("등록된 담당 교사가 없습니다."));
    }

    @Test
    void getMyAssignment_afterRegistration_success() throws Exception {
        String inviteCode = fetchInviteCode();
        registerAssignment(STUDENT1_USERNAME, inviteCode);

        String studentToken = bearerToken(STUDENT1_USERNAME, Role.STUDENT);

        mockMvc.perform(get("/api/student/assignment")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teacherUsername").value(TEACHER_USERNAME))
                .andExpect(jsonPath("$.schoolName").value("통합테스트중학교"));
    }

    @Test
    void reply_cancelledPost_returnsBadRequest() throws Exception {
        Long postId = createAssignedPost(STUDENT1_USERNAME);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        CounselingStatusUpdateDTO cancelRequest = new CounselingStatusUpdateDTO();
        cancelRequest.setStatus(CounselingStatus.CANCELLED);
        mockMvc.perform(patch("/api/counseling/{id}/status", postId)
                .header("Authorization", "Bearer " + teacherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelRequest)));

        CounselingReplyDTO replyRequest = new CounselingReplyDTO();
        replyRequest.setReply("취소 후 답변");

        mockMvc.perform(post("/api/counseling/{id}/reply", postId)
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("취소된 상담에는 답변할 수 없습니다."));
    }

    private Long createAssignedPost(String studentUsername) throws Exception {
        if (assignmentRepository.findByStudent(userRepository.findByUsername(studentUsername).orElseThrow()).isEmpty()) {
            registerAssignment(studentUsername, fetchInviteCode());
        }

        String studentToken = bearerToken(studentUsername, Role.STUDENT);
        String response = mockMvc.perform(post("/api/counseling")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private String fetchInviteCode() throws Exception {
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        String response = mockMvc.perform(get("/api/teacher/invite-code")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).path("code").asText();
    }

    private void registerAssignment(String studentUsername, String inviteCode) throws Exception {
        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setInviteCode(inviteCode);

        String studentToken = bearerToken(studentUsername, Role.STUDENT);

        mockMvc.perform(post("/api/student/assignment")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private CounselingCreateDTO createRequest() {
        CounselingCreateDTO request = new CounselingCreateDTO();
        request.setTitle("상담 제목");
        request.setContent("상담 내용입니다.");
        request.setDesiredDate(LocalDate.now().plusDays(1));
        request.setCounselingType(CounselingType.EMOTIONAL);
        return request;
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }

    private void saveTeacher(String username, String name) {
        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(Role.TEACHER)
                .school(school)
                .name(name)
                .email(username + "@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    private void saveStudent(String username, String name) {
        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(Role.STUDENT)
                .school(school)
                .name(name)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }
}
