package com.ondo.domain.precounseling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSaveRequestDTO;
import com.ondo.domain.precounseling.repository.PreCounselingProfileAccessLogRepository;
import com.ondo.domain.precounseling.repository.StudentPreCounselingProfileRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
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
        "ondo.encryption.dev-mode=true"
})
@AutoConfigureMockMvc
@Transactional
class PreCounselingProfileIntegrationTest {

    private static final String SCHOOL_CODE = "ITPC001";
    private static final String TEACHER_USERNAME = "it-pre-counsel-teacher";
    private static final String OTHER_TEACHER_USERNAME = "it-pre-counsel-other-teacher";
    private static final String STUDENT_USERNAME = "it-pre-counsel-student";

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
    private StudentPreCounselingProfileRepository profileRepository;

    @Autowired
    private PreCounselingProfileAccessLogRepository accessLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private School school;

    @BeforeEach
    void setUp() throws Exception {
        school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("통합테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build());

        userRepository.save(buildTeacher(TEACHER_USERNAME));
        userRepository.save(buildTeacher(OTHER_TEACHER_USERNAME));
        userRepository.save(buildStudent(STUDENT_USERNAME));
        registerAssignment();
    }

    @Test
    void saveAndGetProfile_encryptsPhoneNumbers() throws Exception {
        String studentToken = bearerToken(STUDENT_USERNAME, Role.STUDENT);

        mockMvc.perform(put("/api/student/pre-counseling-profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.completed").value(true))
                .andExpect(jsonPath("$.profile.studentPhone").value("01011112222"))
                .andExpect(jsonPath("$.profile.futureHope").value("교사"));

        var stored = profileRepository.findById(STUDENT_USERNAME).orElseThrow();
        assertThat(stored.getStudentPhoneEncrypted()).isNotBlank();
        assertThat(stored.getStudentPhoneEncrypted()).doesNotContain("01011112222");
        assertThat(stored.getParentPhoneEncrypted()).doesNotContain("01033334444");

        mockMvc.perform(get("/api/student/pre-counseling-profile")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.studentPhone").value("01011112222"))
                .andExpect(jsonPath("$.personalityStrength").value("친절함"));
    }

    @Test
    void teacherCanViewAssignedStudentProfile_andAccessIsLogged() throws Exception {
        String studentToken = bearerToken(STUDENT_USERNAME, Role.STUDENT);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(put("/api/student/pre-counseling-profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teacher/pre-counseling-profiles/" + STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentUsername").value(STUDENT_USERNAME))
                .andExpect(jsonPath("$.parentPhone").value("01033334444"));

        var student = userRepository.findByUsername(STUDENT_USERNAME).orElseThrow();
        var teacher = userRepository.findByUsername(TEACHER_USERNAME).orElseThrow();
        assertThat(accessLogRepository.countByStudentAndTeacher(student, teacher)).isEqualTo(1);
    }

    @Test
    void teacherCannotViewNonAssignedStudentProfile() throws Exception {
        String studentToken = bearerToken(STUDENT_USERNAME, Role.STUDENT);
        String otherTeacherToken = bearerToken(OTHER_TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(put("/api/student/pre-counseling-profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teacher/pre-counseling-profiles/" + STUDENT_USERNAME)
                        .header("Authorization", "Bearer " + otherTeacherToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("담당 학생의 사전 상담 카드만 열람할 수 있습니다."));
    }

    @Test
    void teacherSummaries_showCompletionStatus() throws Exception {
        String studentToken = bearerToken(STUDENT_USERNAME, Role.STUDENT);
        String teacherToken = bearerToken(TEACHER_USERNAME, Role.TEACHER);

        mockMvc.perform(get("/api/teacher/pre-counseling-profiles")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completed").value(false));

        mockMvc.perform(put("/api/student/pre-counseling-profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teacher/pre-counseling-profiles")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completed").value(true))
                .andExpect(jsonPath("$[0].studentUsername", is(STUDENT_USERNAME)));
    }

    private PreCounselingProfileSaveRequestDTO sampleRequest() {
        PreCounselingProfileSaveRequestDTO request = new PreCounselingProfileSaveRequestDTO();
        request.setStudentPhone("010-1111-2222");
        request.setParentPhone("010-3333-4444");
        request.setMbti("ENFP");
        request.setFutureHope("교사");
        request.setFavoriteWords("오늘도 화이팅");
        request.setPersonalityStrength("친절함");
        request.setPersonalityWeakness("긴장을 많이 함");
        request.setHobbiesSpecialtiesInterests("독서, 축구");
        request.setHappiestMoment("친구들과 웃을 때");
        request.setStressfulMoment("시험 전날");
        request.setStressReliefMethod("음악 듣기");
        request.setMemorableSchoolMoment("체육대회 1등");
        request.setDesiredFriendType("밝고 다정한 친구");
        request.setDesiredClassRole("환경부");
        return request;
    }

    private void registerAssignment() throws Exception {
        String inviteCode = fetchInviteCode();
        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setInviteCode(inviteCode);

        mockMvc.perform(post("/api/student/assignment")
                        .header("Authorization", "Bearer " + bearerToken(STUDENT_USERNAME, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private String fetchInviteCode() throws Exception {
        String response = mockMvc.perform(get("/api/teacher/invite-code")
                        .header("Authorization", "Bearer " + bearerToken(TEACHER_USERNAME, Role.TEACHER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("code").asText();
    }

    private User buildTeacher(String username) {
        return User.builder()
                .username(username)
                .password(passwordEncoder.encode("password123"))
                .role(Role.TEACHER)
                .school(school)
                .name("담당교사")
                .email(username + "@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(java.time.LocalDateTime.now())
                .build();
    }

    private User buildStudent(String username) {
        return User.builder()
                .username(username)
                .password(passwordEncoder.encode("password123"))
                .role(Role.STUDENT)
                .school(school)
                .name("테스트학생")
                .birthDate(java.time.LocalDate.of(2012, 3, 4))
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(java.time.LocalDateTime.now())
                .build();
    }

    private String bearerToken(String username, Role role) {
        return jwtProvider.createAccessToken(username, role);
    }
}
