package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.AccountWithdrawRequestDTO;
import com.ondo.domain.user.dto.LoginRequestDTO;
import com.ondo.domain.user.dto.LoginResponseDTO;
import com.ondo.domain.user.dto.LogoutRequestDTO;
import com.ondo.domain.user.dto.MeResponseDTO;
import com.ondo.domain.user.dto.RefreshTokenRequestDTO;
import com.ondo.domain.user.dto.SignUpRequestDTO;
import com.ondo.domain.user.dto.SignUpResponseDTO;
import com.ondo.domain.user.dto.TokenRefreshResponseDTO;
import com.ondo.domain.user.service.AccountWithdrawService;
import com.ondo.domain.user.service.AuthService;
import com.ondo.domain.user.service.LogoutService;
import com.ondo.domain.user.service.UserService;
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

    @PostMapping("/signup")
    public ResponseEntity<SignUpResponseDTO> signUp(@Valid @RequestBody SignUpRequestDTO request) {
        userService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SignUpResponseDTO.of(request.getUsername(), request.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
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

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponseDTO> refresh(@Valid @RequestBody RefreshTokenRequestDTO request) {
        return ResponseEntity.ok(authService.refresh(request));
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
