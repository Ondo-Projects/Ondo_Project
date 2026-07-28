package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.LoginRequestDTO;
import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.dto.LogoutRequestDTO;
import com.ondo.domain.user.dto.RefreshTokenRequestDTO;
import com.ondo.domain.user.dto.TokenRefreshResponseDTO;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginTokenIssueService loginTokenIssueService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = authenticate(request.getUsername(), request.getPassword());
        return loginTokenIssueService.issueLoginTokens(user);
    }

    public LoginResponseDTO issueLoginTokens(User user) {
        return loginTokenIssueService.issueLoginTokens(user);
    }

    @Transactional
    public TokenRefreshResponseDTO refresh(RefreshTokenRequestDTO request) {
        String username = refreshTokenService.validateAndGetUsername(request.getRefreshToken());
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("유효하지 않은 Refresh Token입니다."));

        refreshTokenService.revoke(request.getRefreshToken());

        LoginResponseDTO tokens = loginTokenIssueService.issueLoginTokens(user);
        return TokenRefreshResponseDTO.of(tokens.getAccessToken(), tokens.getRefreshToken());
    }

    private User authenticate(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        return user;
    }
}
