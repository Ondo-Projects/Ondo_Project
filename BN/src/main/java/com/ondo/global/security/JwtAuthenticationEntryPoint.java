package com.ondo.global.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        if (SecurityRequestMatcher.isApiRequest(request)) {
            SecurityJsonResponseWriter.write(response, HttpServletResponse.SC_UNAUTHORIZED, "인증이 필요합니다.");
            return;
        }

        response.sendRedirect("/login");
    }
}
