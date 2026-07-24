package com.ondo.domain.user.controller;

import com.ondo.domain.user.dto.UserDTO;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; // 추가

@Controller
@Slf4j
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/login")
    public void login(){
        log.info("GET /login...");
    }


    @GetMapping("/join")
    public void join() {
        log.info("GET /join...");

    }


    @PostMapping("/join")
    public String join_post(UserDTO userDTO){
        log.info("POST /join...{}", userDTO);

        User user = User.builder()
                .username(userDTO.getUsername())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .role(userDTO.getRole())
                .build();

        userRepository.save(user);

        return "redirect:/login";
    }

    @GetMapping("/student")
    public void student(){
        log.info("GET /student");
    }

    @GetMapping("/teacher")
    public void teacher(){
        log.info("GET /teacher");
    }

    @GetMapping("/admin")
    public void admin(){
        log.info("GET /admin");
    }
}