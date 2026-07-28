package com.ondo.global.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationEntryPointTest {

    private final JwtAuthenticationEntryPoint entryPoint = new JwtAuthenticationEntryPoint();

    @Test
    void commence_returnsUnauthorizedJsonForApiRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/me");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response, new BadCredentialsException("invalid"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("인증이 필요합니다.");
    }

    @Test
    void commence_redirectsToLoginForWebRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/student");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response, new BadCredentialsException("invalid"));

        assertThat(response.getRedirectedUrl()).isEqualTo("/login");
    }
}
