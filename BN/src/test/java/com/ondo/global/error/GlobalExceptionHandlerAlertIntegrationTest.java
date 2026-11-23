package com.ondo.global.error;

import com.ondo.domain.attention.service.StudentAttentionService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.alert.OperatorAlertService;
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

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 처리되지 않은 서버 오류만 운영자에게 알리고, 요청 쪽 오류는 알리지 않는지 확인합니다. */
@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.weather.dev-mode=true",
        "ondo.retention.enabled=false"
})
@AutoConfigureMockMvc
@Transactional
class GlobalExceptionHandlerAlertIntegrationTest {

    private static final String TEACHER = "it-alert-teacher";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtProvider jwtProvider;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private UserRepository userRepository;

    @MockitoBean private OperatorAlertService operatorAlertService;
    @MockitoBean private StudentAttentionService studentAttentionService;

    @BeforeEach
    void setUp() {
        School school = schoolRepository.save(School.builder()
                .schoolCode("ITALERT01")
                .schoolName("알림테스트중학교")
                .region("서울")
                .schoolType("중학교")
                .build());
        userRepository.save(User.builder()
                .username(TEACHER)
                .password("encoded")
                .role(Role.TEACHER)
                .school(school)
                .name("알림교사")
                .email(TEACHER + "@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void unexpectedError_returns500AndAlertsOperator() throws Exception {
        when(studentAttentionService.getForTeacher(anyString(), any())).thenThrow(new IllegalStateException("boom"));

        mockMvc.perform(get("/api/teacher/attention").header("Authorization", bearer()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));

        verify(operatorAlertService).notifyServerError(any(IllegalStateException.class), eq("GET"), eq("/api/teacher/attention"));
    }

    @Test
    void businessError_isNotAlerted() throws Exception {
        when(studentAttentionService.getForTeacher(anyString(), any()))
                .thenThrow(new BusinessException("접근 권한이 없습니다."));

        mockMvc.perform(get("/api/teacher/attention").header("Authorization", bearer()))
                .andExpect(status().isBadRequest());

        verify(operatorAlertService, never()).notifyServerError(any(), anyString(), anyString());
    }

    @Test
    void malformedJson_returns400WithoutAlert() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ broken"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("요청 형식이 올바르지 않습니다."));

        verify(operatorAlertService, never()).notifyServerError(any(), anyString(), anyString());
    }

    @Test
    void unknownPath_returns404WithoutAlert() throws Exception {
        mockMvc.perform(get("/api/teacher/no-such-endpoint").header("Authorization", bearer()))
                .andExpect(status().isNotFound());

        verify(operatorAlertService, never()).notifyServerError(any(), anyString(), anyString());
    }

    private String bearer() {
        return "Bearer " + jwtProvider.createAccessToken(TEACHER, Role.TEACHER);
    }
}
