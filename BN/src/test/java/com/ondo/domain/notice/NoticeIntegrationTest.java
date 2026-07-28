package com.ondo.domain.notice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.notice.dto.NoticeCreateDTO;
import com.ondo.domain.notice.entity.TeacherNotice;
import com.ondo.domain.notice.repository.TeacherNoticeRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class NoticeIntegrationTest {

    private static final String TEACHER_USERNAME = "it-notice-teacher";
    private static final String OTHER_TEACHER_USERNAME = "it-notice-other-teacher";

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
    private TeacherNoticeRepository noticeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School school;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode("ITNT001")
                .schoolName("알림테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        saveTeacher(TEACHER_USERNAME, "알림교사");
        saveTeacher(OTHER_TEACHER_USERNAME, "다른교사");
    }

    @Test
    void deleteNotice_removesOwnNotice() throws Exception {
        TeacherNotice notice = noticeRepository.save(TeacherNotice.builder()
                .teacher(userRepository.findByUsername(TEACHER_USERNAME).orElseThrow())
                .title("방학 안내")
                .content("즐거운 방학 보내세요.")
                .createdAt(LocalDateTime.now())
                .build());

        mockMvc.perform(delete("/api/teacher/notices/{id}", notice.getId())
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("알림이 삭제되었습니다."));

        assertThat(noticeRepository.findById(notice.getId())).isEmpty();
    }

    @Test
    void deleteNotice_otherTeacherNotice_returnsBadRequest() throws Exception {
        TeacherNotice notice = noticeRepository.save(TeacherNotice.builder()
                .teacher(userRepository.findByUsername(OTHER_TEACHER_USERNAME).orElseThrow())
                .title("다른 교사 알림")
                .content("삭제 불가")
                .createdAt(LocalDateTime.now())
                .build());

        mockMvc.perform(delete("/api/teacher/notices/{id}", notice.getId())
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("본인이 등록한 알림만 삭제할 수 있습니다."));
    }

    @Test
    void createAndDeleteNotice_flowWorks() throws Exception {
        NoticeCreateDTO request = new NoticeCreateDTO();
        request.setTitle("개학 안내");
        request.setContent("3월 2일 개학합니다.");

        String response = mockMvc.perform(post("/api/teacher/notices")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long noticeId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(delete("/api/teacher/notices/{id}", noticeId)
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME)))
                .andExpect(status().isOk());

        assertThat(noticeRepository.findById(noticeId)).isEmpty();
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

    private String bearerToken(String username) {
        return jwtProvider.createAccessToken(username, Role.TEACHER);
    }
}
