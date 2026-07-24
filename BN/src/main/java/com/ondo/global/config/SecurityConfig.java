package com.ondo.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {


        http.csrf(c -> c.disable());


        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers("/", "/join", "/login", "/css/**", "/js/**", "/images/**").permitAll();
            auth.requestMatchers("/student").hasRole("STUDENT");
            auth.requestMatchers("/teacher").hasRole("TEACHER");
            auth.requestMatchers("/admin").hasRole("ADMIN");
            auth.anyRequest().authenticated();
        });


        http.formLogin(login -> login
                .loginPage("/login")             // 커스텀 로그인 페이지 URL
                .defaultSuccessUrl("/", true)    // 로그인 성공 시 기본 이동 페이지
                .permitAll()
        );

        http.logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login")
                .invalidateHttpSession(true)
        );

        return http.build();
    }
}