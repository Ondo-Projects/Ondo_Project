package com.ondo.global.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpUtilsTest {

    @Test
    void resolveClientIp_usesFirstForwardedForAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");

        assertThat(ClientIpUtils.resolveClientIp(request)).isEqualTo("203.0.113.10");
    }

    @Test
    void resolveClientIp_usesRealIpWhenForwardedForMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Real-IP", "203.0.113.20");

        assertThat(ClientIpUtils.resolveClientIp(request)).isEqualTo("203.0.113.20");
    }

    @Test
    void resolveClientIp_fallsBackToRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");

        assertThat(ClientIpUtils.resolveClientIp(request)).isEqualTo("127.0.0.1");
    }
}
