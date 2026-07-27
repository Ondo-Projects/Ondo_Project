package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.SignUpRequestDTO;
import com.ondo.domain.user.service.UserService;
import com.ondo.global.error.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/login")
    public String login() {
        log.info("GET /login...");
        return "login";
    }

    @GetMapping("/join")
    public String join(@ModelAttribute("signUpRequest") SignUpRequestDTO signUpRequest) {
        log.info("GET /join...");
        return "join";
    }

    @PostMapping("/join")
    public String joinPost(
            @Valid @ModelAttribute("signUpRequest") SignUpRequestDTO signUpRequest,
            BindingResult bindingResult,
            Model model
    ) {
        log.info("POST /join... username={}, role={}", signUpRequest.getUsername(), signUpRequest.getRole());

        if (bindingResult.hasErrors()) {
            model.addAttribute("errorMessage", "입력값을 다시 확인해 주세요.");
            return "join";
        }

        try {
            userService.signUp(signUpRequest);
        } catch (BusinessException exception) {
            model.addAttribute("errorMessage", exception.getMessage());
            return "join";
        }

        return "redirect:/login?joined=true";
    }

    @GetMapping("/student")
    public String student() {
        log.info("GET /student");
        return "student";
    }

    @GetMapping("/teacher")
    public String teacher() {
        log.info("GET /teacher");
        return "teacher";
    }

    @GetMapping("/admin")
    public String admin() {
        log.info("GET /admin");
        return "admin";
    }
}
