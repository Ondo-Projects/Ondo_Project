package com.ondo.global.config;

import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.service.LoginTokenIssueService;
import com.ondo.global.security.TokenCookieService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomSucessHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoginTokenIssueService loginTokenIssueService;

    @Mock
    private TokenCookieService tokenCookieService;

    @InjectMocks
    private CustomSucessHandler customSucessHandler;

    @Test
    void onAuthenticationSuccess_issuesTokensAndRedirectsStudent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "student01",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );
        User user = User.builder()
                .username("student01")
                .password("encoded-password")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findByUsername("student01")).thenReturn(Optional.of(user));
        when(loginTokenIssueService.issueLoginTokens(user)).thenReturn(
                LoginResponseDTO.of("access-token", "refresh-token", "student01", "STUDENT")
        );

        customSucessHandler.onAuthenticationSuccess(request, response, authentication);

        verify(tokenCookieService).writeTokens(response, "access-token", "refresh-token");
        assertThat(response.getRedirectedUrl()).isEqualTo("/home");
    }

    @Test
    void onAuthenticationSuccess_redirectsTeacherToTeacherPage() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "teacher01",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_TEACHER"))
        );
        User user = User.builder()
                .username("teacher01")
                .password("encoded-password")
                .role(Role.TEACHER)
                .build();

        when(userRepository.findByUsername("teacher01")).thenReturn(Optional.of(user));
        when(loginTokenIssueService.issueLoginTokens(user)).thenReturn(
                LoginResponseDTO.of("access-token", "refresh-token", "teacher01", "TEACHER")
        );

        customSucessHandler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

        assertThat(response.getRedirectedUrl()).isEqualTo("/home");
    }

    @Test
    void onAuthenticationSuccess_redirectsAdminToAdminPage() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "admin01",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        User user = User.builder()
                .username("admin01")
                .password("encoded-password")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findByUsername("admin01")).thenReturn(Optional.of(user));
        when(loginTokenIssueService.issueLoginTokens(user)).thenReturn(
                LoginResponseDTO.of("access-token", "refresh-token", "admin01", "ADMIN")
        );

        customSucessHandler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

        assertThat(response.getRedirectedUrl()).isEqualTo("/admin");
    }
}
