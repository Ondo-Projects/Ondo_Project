package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.UsernameCheckResponseDTO;
import com.ondo.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/username")
@RequiredArgsConstructor
public class UsernameCheckController {

    private final UserService userService;

    @GetMapping("/check")
    public ResponseEntity<UsernameCheckResponseDTO> check(@RequestParam String username) {
        return ResponseEntity.ok(userService.checkUsernameAvailability(username));
    }
}
