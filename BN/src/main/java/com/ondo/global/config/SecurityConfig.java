package com.ondo.global.config;

import com.ondo.global.security.JwtAccessDeniedHandler;
import com.ondo.global.security.JwtAuthenticationEntryPoint;
import com.ondo.global.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/**")
                .csrf(c -> c.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(
                            "/api/auth/login",
                            "/api/auth/signup",
                            "/api/auth/refresh",
                            "/api/auth/logout",
                            "/api/auth/email/**",
                            "/api/auth/sms/**",
                            "/api/auth/username/**",
                            "/api/auth/recovery/**",
                            "/api/schools/**"
                    ).permitAll();
                    auth.requestMatchers("/api/common/**").hasAnyRole("STUDENT", "TEACHER");
                    auth.requestMatchers("/api/teacher/**").hasRole("TEACHER");
                    auth.requestMatchers("/api/student/**").hasRole("STUDENT");
                    auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * /api 밖의 요청 — 화면은 React(nginx 정적 파일)가 담당하므로 백엔드에는 열어 둘 경로가 없습니다.
     * (예전 Thymeleaf 화면·폼 로그인은 제거됨) /error 만 허용해 API 오류 응답이 그대로 전달되게 합니다.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain fallbackSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher(request -> {
                    String uri = request.getRequestURI();
                    return uri == null || !uri.startsWith("/api/");
                })
                .csrf(c -> c.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/error").permitAll();
                    auth.anyRequest().denyAll();
                })
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                );

        return http.build();
    }
}
