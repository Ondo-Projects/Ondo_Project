package com.ondo.domain.counseling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.counseling.dto.CounselingCreateDTO;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.profile.dto.TeacherNotificationSettingsUpdateRequestDTO;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.sms.SolapiSmsSender;
import com.ondo.global.util.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.solapi.dev-mode=true"
})
@AutoConfigureMockMvc
@Transactional
class CounselingNotificationIntegrationTest {

    private static final String SCHOOL_CODE = "ITCN001";
    private static final String TEACHER_USERNAME = "it-counsel-notify-teacher";
    private static final String STUDENT_USERNAME = "it-counsel-notify-student";

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

    @MockBean
    private SolapiSmsSender solapiSmsSender;

    @BeforeEach
    void setUp() throws Exception {
        School school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("상담알림통합중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        userRepository.save(User.builder()
                .username(TEACHER_USERNAME)
                .password(passwordEncoder.encode("password"))
                .role(Role.TEACHER)
                .school(school)
                .name("알림교사")
                .email("notify@korea.kr")
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

        registerAssignment();
        enableTeacherSmsNotification();
    }

    @Test
    void createCounseling_notifiesTeacherWhenSmsEnabled() throws Exception {
        CounselingCreateDTO request = new CounselingCreateDTO();
        request.setTitle("상담 제목");
        request.setContent("상담 내용");
        request.setDesiredDate(LocalDate.now().plusDays(1));
        request.setCounselingType(CounselingType.EMOTIONAL);

        mockMvc.perform(post("/api/counseling")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(solapiSmsSender).sendSms(eq("01099998888"), anyString());
    }

    @Test
    void createCounseling_skipsSmsWhenTeacherConsentDisabled() throws Exception {
        TeacherNotificationSettingsUpdateRequestDTO settings = new TeacherNotificationSettingsUpdateRequestDTO();
        settings.setPhone("01099998888");
        settings.setSmsNotifyEnabled(false);

        mockMvc.perform(put("/api/teacher/profile/notification-settings")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settings)))
                .andExpect(status().isOk());

        CounselingCreateDTO request = new CounselingCreateDTO();
        request.setTitle("상담 제목");
        request.setContent("상담 내용");
        request.setDesiredDate(LocalDate.now().plusDays(1));
        request.setCounselingType(CounselingType.EMOTIONAL);

        mockMvc.perform(post("/api/counseling")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(solapiSmsSender, never()).sendSms(anyString(), anyString());
    }

    private void enableTeacherSmsNotification() throws Exception {
        TeacherNotificationSettingsUpdateRequestDTO settings = new TeacherNotificationSettingsUpdateRequestDTO();
        settings.setPhone("01099998888");
        settings.setSmsNotifyEnabled(true);

        mockMvc.perform(put("/api/teacher/profile/notification-settings")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settings)))
                .andExpect(status().isOk());
    }

    private void registerAssignment() throws Exception {
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);
        String inviteResponse = mockMvc.perform(get("/api/teacher/invite-code")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String inviteCode = objectMapper.readTree(inviteResponse).path("code").asText();

        AssignmentRequestDTO assignmentRequest = new AssignmentRequestDTO();
        assignmentRequest.setInviteCode(inviteCode);

        mockMvc.perform(post("/api/student/assignment")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignmentRequest)))
                .andExpect(status().isCreated());
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
