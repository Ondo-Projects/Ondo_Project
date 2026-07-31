package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.GuardianSmsSendRequestDTO;
import com.ondo.domain.user.dto.GuardianSmsVerifyRequestDTO;
import com.ondo.domain.user.service.GuardianSmsVerificationService;
import com.ondo.global.web.ClientIpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/sms")
@RequiredArgsConstructor
public class GuardianSmsVerificationController {

    private final GuardianSmsVerificationService guardianSmsVerificationService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendCode(
            @Valid @RequestBody GuardianSmsSendRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        guardianSmsVerificationService.sendVerificationCode(
                request,
                ClientIpUtils.resolveClientIp(httpRequest)
        );
        return ResponseEntity.ok(Map.of("message", "보호자 휴대폰으로 인증번호가 발송되었습니다."));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyCode(@Valid @RequestBody GuardianSmsVerifyRequestDTO request) {
        guardianSmsVerificationService.verifyCode(request.getPhone(), request.getCode());
        return ResponseEntity.ok(Map.of("message", "법정대리인 SMS 인증이 완료되었습니다."));
    }
}
