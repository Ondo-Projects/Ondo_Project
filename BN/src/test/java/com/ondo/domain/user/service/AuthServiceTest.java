package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.LoginRequestDTO;
import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.dto.RefreshTokenRequestDTO;
import com.ondo.domain.user.dto.TokenRefreshResponseDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private LoginTokenIssueService loginTokenIssueService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private LoginRequestDTO loginRequest;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("student01")
                .password("encoded-password")
                .role(Role.STUDENT)
                .build();

        loginRequest = new LoginRequestDTO();
        loginRequest.setUsername("student01");
        loginRequest.setPassword("Password1!");
    }

    @Test
    void login_returnsAccessAndRefreshTokenWhenCredentialsAreValid() {
        when(userRepository.findByUsername("student01")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1!", "encoded-password")).thenReturn(true);
        when(loginTokenIssueService.issueLoginTokens(user)).thenReturn(
                LoginResponseDTO.of("access-token", "refresh-token", "student01", "STUDENT")
        );

        LoginResponseDTO response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUsername()).isEqualTo("student01");
        assertThat(response.getRole()).isEqualTo("STUDENT");
    }

    @Test
    void login_throwsWhenUserNotFound() {
        when(userRepository.findByUsername("student01")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    @Test
    void login_throwsWhenPasswordDoesNotMatch() {
        when(userRepository.findByUsername("student01")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(eq("Password1!"), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    @Test
    void refresh_returnsNewTokensAndRotatesRefreshToken() {
        RefreshTokenRequestDTO request = new RefreshTokenRequestDTO();
        request.setRefreshToken("old-refresh-token");

        when(refreshTokenService.validateAndGetUsername("old-refresh-token")).thenReturn("student01");
        when(userRepository.findByUsername("student01")).thenReturn(Optional.of(user));
        when(loginTokenIssueService.issueLoginTokens(user)).thenReturn(
                LoginResponseDTO.of("new-access-token", "new-refresh-token", "student01", "STUDENT")
        );

        TokenRefreshResponseDTO response = authService.refresh(request);

        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        verify(refreshTokenService).revoke("old-refresh-token");
    }
}
