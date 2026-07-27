package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.EmailSendRequestDTO;
import com.ondo.domain.user.dto.EmailVerifyRequestDTO;
import com.ondo.domain.user.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendCode(@Valid @RequestBody EmailSendRequestDTO request) {
        emailVerificationService.sendVerificationCode(request.getEmail(), request.getRole());
        return ResponseEntity.ok(Map.of("message", "인증번호가 발송되었습니다."));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyCode(@Valid @RequestBody EmailVerifyRequestDTO request) {
        emailVerificationService.verifyCode(request.getEmail(), request.getCode(), request.getRole());
        return ResponseEntity.ok(Map.of("message", "이메일 인증이 완료되었습니다."));
    }

    @PostMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status(@Valid @RequestBody EmailSendRequestDTO request) {
        emailVerificationService.validateEmailForRole(request.getEmail(), request.getRole());
        return ResponseEntity.ok(Map.of(
                "verified",
                emailVerificationService.isVerified(request.getEmail())
        ));
    }
}
