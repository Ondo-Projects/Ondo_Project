package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.FindIdSendRequestDTO;
import com.ondo.domain.user.dto.FindIdVerifyRequestDTO;
import com.ondo.domain.user.dto.FindIdVerifyResponseDTO;
import com.ondo.domain.user.dto.PasswordRecoveryResetRequestDTO;
import com.ondo.domain.user.dto.PasswordRecoverySendRequestDTO;
import com.ondo.domain.user.service.AccountRecoveryService;
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
@RequestMapping("/api/auth/recovery")
@RequiredArgsConstructor
public class AccountRecoveryController {

    private final AccountRecoveryService accountRecoveryService;

    @PostMapping("/id/send")
    public ResponseEntity<Map<String, String>> sendFindIdCode(
            @Valid @RequestBody FindIdSendRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(accountRecoveryService.sendFindIdCode(
                request,
                ClientIpUtils.resolveClientIp(httpRequest)
        ));
    }

    @PostMapping("/id/verify")
    public ResponseEntity<FindIdVerifyResponseDTO> verifyFindId(
            @Valid @RequestBody FindIdVerifyRequestDTO request
    ) {
        return ResponseEntity.ok(accountRecoveryService.verifyFindId(request));
    }

    @PostMapping("/password/send")
    public ResponseEntity<Map<String, String>> sendPasswordResetCode(
            @Valid @RequestBody PasswordRecoverySendRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(accountRecoveryService.sendPasswordResetCode(
                request,
                ClientIpUtils.resolveClientIp(httpRequest)
        ));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody PasswordRecoveryResetRequestDTO request
    ) {
        return ResponseEntity.ok(accountRecoveryService.resetPassword(request));
    }
}
