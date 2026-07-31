package com.ondo.domain.suggestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.admin.repository.AdminActivityLogRepository;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.suggestion.dto.SuggestionCreateDTO;
import com.ondo.domain.suggestion.dto.SuggestionReplyDTO;
import com.ondo.domain.suggestion.dto.SuggestionStatusUpdateDTO;
import com.ondo.domain.suggestion.dto.SuggestionUpdateDTO;
import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.suggestion.repository.SuggestionPostRepository;
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
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.admin.bootstrap.enabled=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
@Transactional
class SuggestionIntegrationTest {

    private static final String SCHOOL_CODE = "SUGG_T001";
    private static final String ADMIN_USERNAME = "it-sugg-admin";
    private static final String STUDENT_USERNAME = "it-sugg-student";
    private static final String OTHER_STUDENT_USERNAME = "it-sugg-student2";
    private static final String TEACHER_USERNAME = "it-sugg-teacher";
    private static final String OTHER_TEACHER_USERNAME = "it-sugg-teacher2";

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
    private SuggestionPostRepository suggestionPostRepository;

    @Autowired
    private AdminActivityLogRepository adminActivityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School school;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("건의테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build());

        saveUser(ADMIN_USERNAME, Role.ADMIN, "관리자");
        saveUser(STUDENT_USERNAME, Role.STUDENT, "학생1");
        saveUser(OTHER_STUDENT_USERNAME, Role.STUDENT, "학생2");
        saveUser(TEACHER_USERNAME, Role.TEACHER, "교사1");
        saveUser(OTHER_TEACHER_USERNAME, Role.TEACHER, "교사2");
    }

    @Test
    void student_createAndList_returnsOwnPosts() throws Exception {
        mockMvc.perform(post("/api/student/suggestions")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest("급식 오류", "급식이 보이지 않습니다."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.category").value("BUG"))
                .andExpect(jsonPath("$.authorUsername").value(STUDENT_USERNAME));

        mockMvc.perform(get("/api/student/suggestions")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("급식 오류"));
    }

    @Test
    void student_getOtherStudentPost_returnsForbidden() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "다른 학생 글", "내용").getId();

        mockMvc.perform(get("/api/student/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(OTHER_STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void student_updateOpenPost_succeeds() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "수정 전", "내용").getId();

        SuggestionUpdateDTO request = new SuggestionUpdateDTO();
        request.setCategory(SuggestionCategory.FEATURE);
        request.setTitle("수정 후");
        request.setContent("개선 요청입니다.");

        mockMvc.perform(put("/api/student/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정 후"))
                .andExpect(jsonPath("$.category").value("FEATURE"));
    }

    @Test
    void student_updateInReviewPost_returnsBadRequest() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "검토 중", "내용").getId();

        mockMvc.perform(patch("/api/admin/suggestions/{id}/status", postId)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_REVIEW\"}"))
                .andExpect(status().isOk());

        SuggestionUpdateDTO request = new SuggestionUpdateDTO();
        request.setCategory(SuggestionCategory.BUG);
        request.setTitle("수정 시도");
        request.setContent("불가");

        mockMvc.perform(put("/api/student/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("접수 상태의 건의 글만 수정하거나 삭제할 수 있습니다."));
    }

    @Test
    void student_deleteOpenPost_softDeletes() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "삭제 대상", "내용").getId();

        mockMvc.perform(delete("/api/student/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("건의 글이 삭제되었습니다."));

        SuggestionPost deleted = suggestionPostRepository.findById(postId).orElseThrow();
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    void teacher_createAndGet_succeeds() throws Exception {
        String response = mockMvc.perform(post("/api/teacher/suggestions")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest("UI 개선", "교사 홈 버튼이 작습니다."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authorRole").value("TEACHER"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long postId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/teacher/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("UI 개선"));
    }

    @Test
    void teacher_getOtherTeacherPost_returnsForbidden() throws Exception {
        Long postId = saveSuggestion(TEACHER_USERNAME, "다른 교사 글", "내용").getId();

        mockMvc.perform(get("/api/teacher/suggestions/{id}", postId)
                        .header("Authorization", "Bearer " + bearerToken(OTHER_TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void admin_searchListsAllPosts() throws Exception {
        saveSuggestion(STUDENT_USERNAME, "학생 건의", "학생 내용");
        saveSuggestion(TEACHER_USERNAME, "교사 건의", "교사 내용");

        mockMvc.perform(get("/api/admin/suggestions")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(2)));

        mockMvc.perform(get("/api/admin/suggestions")
                        .param("role", "STUDENT")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].authorRole").value("STUDENT"));
    }

    @Test
    void admin_updateStatus_recordsActivityLog() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "상태 변경", "내용").getId();

        SuggestionStatusUpdateDTO request = new SuggestionStatusUpdateDTO();
        request.setStatus(SuggestionStatus.IN_REVIEW);

        mockMvc.perform(patch("/api/admin/suggestions/{id}/status", postId)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        assertThat(adminActivityLogRepository.findAll()).anyMatch(log ->
                "SUGGESTION_STATUS_CHANGE".equals(log.getAction())
                        && STUDENT_USERNAME.equals(log.getTargetUsername())
                        && ADMIN_USERNAME.equals(log.getAdminUsername()));
    }

    @Test
    void admin_reply_recordsActivityLogAndReturnsReply() throws Exception {
        Long postId = saveSuggestion(STUDENT_USERNAME, "답변 대상", "내용").getId();

        SuggestionReplyDTO request = new SuggestionReplyDTO();
        request.setReply("확인했습니다. 다음 배포에 반영하겠습니다.");

        mockMvc.perform(post("/api/admin/suggestions/{id}/reply", postId)
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminReply").value("확인했습니다. 다음 배포에 반영하겠습니다."))
                .andExpect(jsonPath("$.repliedByUsername").value(ADMIN_USERNAME));

        assertThat(adminActivityLogRepository.findAll()).anyMatch(log ->
                "SUGGESTION_REPLY".equals(log.getAction())
                        && STUDENT_USERNAME.equals(log.getTargetUsername()));
    }

    @Test
    void student_createSuggestion_asAdminOnStudentEndpoint_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/student/suggestions")
                        .header("Authorization", "Bearer " + bearerToken(ADMIN_USERNAME, Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest("관리자 작성", "불가"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    private SuggestionPost saveSuggestion(String authorUsername, String title, String content) {
        User author = userRepository.findByUsername(authorUsername).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        return suggestionPostRepository.save(SuggestionPost.builder()
                .author(author)
                .category(SuggestionCategory.OTHER)
                .title(title)
                .content(content)
                .status(SuggestionStatus.OPEN)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private SuggestionCreateDTO createRequest(String title, String content) {
        SuggestionCreateDTO request = new SuggestionCreateDTO();
        request.setCategory(SuggestionCategory.BUG);
        request.setTitle(title);
        request.setContent(content);
        return request;
    }

    private void saveUser(String username, Role role, String name) {
        userRepository.save(User.builder()
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
