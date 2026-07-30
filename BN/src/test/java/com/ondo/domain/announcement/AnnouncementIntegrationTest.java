package com.ondo.domain.announcement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.announcement.dto.AnnouncementCreateDTO;
import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import com.ondo.domain.announcement.repository.PlatformAnnouncementRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class AnnouncementIntegrationTest {

    private static final String ADMIN_USERNAME = "it-announcement-admin";
    private static final String TEACHER_USERNAME = "it-announcement-teacher";
    private static final String STUDENT_USERNAME = "it-announcement-student";

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
    private PlatformAnnouncementRepository announcementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User admin;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITAN001")
                .schoolName("공지테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        admin = saveUser(ADMIN_USERNAME, Role.ADMIN, "관리자", school);
        saveUser(TEACHER_USERNAME, Role.TEACHER, "담당교사", school);
        saveUser(STUDENT_USERNAME, Role.STUDENT, "테스트학생", school);
    }

    @Test
    void createAnnouncement_allAudience_visibleToStudentAndTeacher() throws Exception {
        AnnouncementCreateDTO request = createRequest("점검 안내", "오늘 밤 점검합니다.", AnnouncementAudience.ALL);

        mockMvc.perform(post("/api/admin/announcements")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("점검 안내"))
                .andExpect(jsonPath("$.audience").value("ALL"))
                .andExpect(jsonPath("$.adminUsername").value(ADMIN_USERNAME));

        mockMvc.perform(get("/api/common/announcements")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("점검 안내"));

        mockMvc.perform(get("/api/common/announcements")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("점검 안내"));
    }

    @Test
    void commonAnnouncements_filtersByAudience() throws Exception {
        saveAnnouncement("학생 공지", AnnouncementAudience.STUDENT);
        saveAnnouncement("교사 공지", AnnouncementAudience.TEACHER);
        saveAnnouncement("전체 공지", AnnouncementAudience.ALL);

        mockMvc.perform(get("/api/common/announcements")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.title == '학생 공지')]").exists())
                .andExpect(jsonPath("$[?(@.title == '전체 공지')]").exists())
                .andExpect(jsonPath("$[?(@.title == '교사 공지')]").doesNotExist());

        mockMvc.perform(get("/api/common/announcements")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.title == '교사 공지')]").exists())
                .andExpect(jsonPath("$[?(@.title == '전체 공지')]").exists())
                .andExpect(jsonPath("$[?(@.title == '학생 공지')]").doesNotExist());
    }

    @Test
    void deleteAnnouncement_removesRecord() throws Exception {
        PlatformAnnouncement announcement = saveAnnouncement("삭제 대상", AnnouncementAudience.ALL);

        mockMvc.perform(delete("/api/admin/announcements/{id}", announcement.getId())
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("공지가 삭제되었습니다."));

        assertThat(announcementRepository.findById(announcement.getId())).isEmpty();
    }

    @Test
    void createAnnouncement_nonAdminForbidden() throws Exception {
        AnnouncementCreateDTO request = createRequest("권한 없음", "내용", AnnouncementAudience.ALL);

        mockMvc.perform(post("/api/admin/announcements")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    private AnnouncementCreateDTO createRequest(String title, String content, AnnouncementAudience audience) {
        AnnouncementCreateDTO request = new AnnouncementCreateDTO();
        request.setTitle(title);
        request.setContent(content);
        request.setAudience(audience);
        return request;
    }

    private PlatformAnnouncement saveAnnouncement(String title, AnnouncementAudience audience) {
        return announcementRepository.save(PlatformAnnouncement.builder()
                .title(title)
                .content(title + " 내용")
                .audience(audience)
                .admin(admin)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private User saveUser(String username, Role role, String name, School school) {
        return userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .school(school)
                .name(name)
                .email(username + "@test.local")
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
