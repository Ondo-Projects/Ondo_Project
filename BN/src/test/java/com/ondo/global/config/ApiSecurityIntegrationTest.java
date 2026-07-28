package com.ondo.global.config;

import com.ondo.domain.user.entity.Role;
import com.ondo.global.util.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!"
})
@AutoConfigureMockMvc
class ApiSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Test
    void teacherHealth_returnsForbiddenForStudentToken() throws Exception {
        String token = jwtProvider.createAccessToken("student01", Role.STUDENT);

        mockMvc.perform(get("/api/teacher/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void teacherHealth_returnsOkForTeacherToken() throws Exception {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);

        mockMvc.perform(get("/api/teacher/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("teacher ok"));
    }

    @Test
    void studentHealth_returnsOkForStudentToken() throws Exception {
        String token = jwtProvider.createAccessToken("student01", Role.STUDENT);

        mockMvc.perform(get("/api/student/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("student ok"));
    }

    @Test
    void studentHealth_returnsForbiddenForTeacherToken() throws Exception {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);

        mockMvc.perform(get("/api/student/health")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("접근 권한이 없습니다."));
    }

    @Test
    void schoolSearch_remainsPublic() throws Exception {
        mockMvc.perform(get("/api/schools/search").param("keyword", "서울"))
                .andExpect(status().isOk());
    }
}
