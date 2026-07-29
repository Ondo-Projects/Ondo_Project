package com.ondo.global.config;

import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.service.LoginTokenIssueService;
import com.ondo.global.error.BusinessException;
import com.ondo.global.security.TokenCookieService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomSucessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final LoginTokenIssueService loginTokenIssueService;
    private final TokenCookieService tokenCookieService;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new BusinessException("사용자 정보를 찾을 수 없습니다."));

        LoginResponseDTO tokens = loginTokenIssueService.issueLoginTokens(user);
        tokenCookieService.writeTokens(response, tokens.getAccessToken(), tokens.getRefreshToken());

        response.sendRedirect(resolveRedirectUrl(authentication));
    }

    private String resolveRedirectUrl(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            switch (authority.getAuthority()) {
                case "ROLE_STUDENT":
                    return "/home";
                case "ROLE_TEACHER":
                    return "/home";
                case "ROLE_ADMIN":
                    return "/admin";
                default:
                    break;
            }
        }
        return "/";
    }
}
