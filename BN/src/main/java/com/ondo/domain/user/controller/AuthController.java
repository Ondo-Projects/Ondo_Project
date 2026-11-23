package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.AccountWithdrawRequestDTO;
import com.ondo.domain.user.dto.AuthSessionResponseDTO;
import com.ondo.domain.user.dto.LoginRequestDTO;
import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.dto.LogoutRequestDTO;
import com.ondo.domain.user.dto.MeResponseDTO;
import com.ondo.domain.user.dto.SignUpRequestDTO;
import com.ondo.domain.user.dto.SignUpResponseDTO;
import com.ondo.domain.user.service.AccountWithdrawService;
import com.ondo.domain.user.service.AuthService;
import com.ondo.domain.user.service.LogoutService;
import com.ondo.domain.user.service.UserService;
import com.ondo.global.error.BusinessException;
import com.ondo.global.security.TokenCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LogoutService logoutService;
    private final UserService userService;
    private final AccountWithdrawService accountWithdrawService;
    private final TokenCookieService tokenCookieService;

    @PostMapping("/signup")
    public ResponseEntity<SignUpResponseDTO> signUp(@Valid @RequestBody SignUpRequestDTO request) {
        userService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SignUpResponseDTO.of(request.getUsername(), request.getRole()));
    }

    /**
     * 로그인 — 토큰은 httpOnly 쿠키로만 내려주고, 본문에는 사용자 정보만 담습니다.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletResponse httpResponse
    ) {
        LoginResponseDTO tokens = authService.login(request);
        tokenCookieService.writeTokens(httpResponse, tokens.getAccessToken(), tokens.getRefreshToken());
        return ResponseEntity.ok(AuthSessionResponseDTO.from(tokens));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getMe(authentication.getName()));
    }

    @PostMapping("/me/withdraw")
    public ResponseEntity<Map<String, String>> withdraw(
            Authentication authentication,
            @Valid @RequestBody AccountWithdrawRequestDTO request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        return ResponseEntity.ok(accountWithdrawService.withdraw(
                authentication.getName(),
                request,
                httpRequest,
                httpResponse
        ));
    }

    /**
     * 토큰 갱신 — refresh 토큰은 쿠키(/api/auth 경로)에서만 읽습니다.
     * 실패하면 쿠키를 지워 브라우저가 로그아웃 상태가 되게 합니다.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        try {
            LoginResponseDTO tokens = authService.refresh(tokenCookieService.resolveRefreshToken(httpRequest));
            tokenCookieService.writeTokens(httpResponse, tokens.getAccessToken(), tokens.getRefreshToken());
            return ResponseEntity.ok(Map.of("message", "토큰이 갱신되었습니다."));
        } catch (BusinessException exception) {
            tokenCookieService.clearTokens(httpResponse);
            throw exception;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) LogoutRequestDTO request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        logoutService.logout(httpRequest, httpResponse, refreshToken);
        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }
}
