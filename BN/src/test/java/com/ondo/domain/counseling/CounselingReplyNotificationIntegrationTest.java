package com.ondo.domain.counseling;

import com.ondo.domain.counseling.dto.CounselingReplyDTO;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.counseling.service.CounselingService;
import com.ondo.domain.counseling.service.StudentReplyNotificationService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class CounselingReplyNotificationIntegrationTest {

    private static final String TEACHER = "it-reply-teacher";
    private static final String STUDENT = "it-reply-student";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtProvider jwtProvider;
    @Autowired private CounselingService counselingService;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StudentTeacherAssignmentRepository assignmentRepository;
    @Autowired private CounselingPostRepository counselingPostRepository;

    @MockitoBean private StudentReplyNotificationService studentReplyNotificationService;

    private CounselingPost post;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITREPLY01")
                .schoolName("답변알림중학교")
                .region("서울")
                .schoolType("중학교")
                .build());
        User teacher = saveUser(TEACHER, Role.TEACHER, school, TEACHER + "@korea.kr");
        User student = saveUser(STUDENT, Role.STUDENT, school, "reply-student@test.com");
        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(teacher).student(student).assignedAt(LocalDateTime.now()).build());
        post = counselingPostRepository.save(CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title("상담")
                .content("내용")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.CAREER)
                .status(CounselingStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void onlyFirstReply_notifiesStudent() {
        counselingService.reply(TEACHER, post.getId(), reply("첫 답변입니다."));
        counselingService.reply(TEACHER, post.getId(), reply("답변을 고쳤어요."));

        verify(studentReplyNotificationService, times(1)).notifyReplied(any(CounselingPost.class));
    }

    @Test
    void studentCanTurnOffReplyEmail() throws Exception {
        mockMvc.perform(get("/api/student/profile/notification-settings").header("Authorization", bearer(STUDENT, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.replyEmailEnabled").value(true))
                .andExpect(jsonPath("$.email").value("reply-student@test.com"));

        mockMvc.perform(put("/api/student/profile/notification-settings")
                        .header("Authorization", bearer(STUDENT, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"replyEmailEnabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.replyEmailEnabled").value(false));

        mockMvc.perform(get("/api/student/profile/notification-settings").header("Authorization", bearer(STUDENT, Role.STUDENT)))
                .andExpect(jsonPath("$.replyEmailEnabled").value(false));
    }

    @Test
    void settingsApi_isStudentOnly() throws Exception {
        mockMvc.perform(get("/api/student/profile/notification-settings").header("Authorization", bearer(TEACHER, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    private CounselingReplyDTO reply(String text) {
        CounselingReplyDTO dto = new CounselingReplyDTO();
        dto.setReply(text);
        return dto;
    }

    private User saveUser(String username, Role role, School school, String email) {
        return userRepository.save(User.builder()
                .username(username)
                .password("encoded")
                .role(role)
                .school(school)
                .name(username)
                .email(email)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    private String bearer(String username, Role role) {
        return "Bearer " + jwtProvider.createAccessToken(username, role);
    }
}
