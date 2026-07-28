package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.entity.User;
import com.ondo.global.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginTokenIssueService {

    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    public LoginResponseDTO issueLoginTokens(User user) {
        String accessToken = jwtProvider.createAccessToken(user.getUsername(), user.getRole());
        String refreshToken = refreshTokenService.issueRefreshToken(user.getUsername());

        return LoginResponseDTO.of(
                accessToken,
                refreshToken,
                user.getUsername(),
                user.getRole().name()
        );
    }
}
