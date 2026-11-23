package com.ondo.global.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpUtilsTest {

    /**
     * X-Forwarded-For 는 클라이언트가 마음대로 넣을 수 있어 직접 읽지 않습니다.
     * nginx 뒤의 실제 IP 반영은 server.forward-headers-strategy=native (RemoteIpValve)가 담당합니다.
     */
    @Test
    void resolveClientIp_ignoresSpoofedForwardedForHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.7");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");
        request.addHeader("X-Real-IP", "203.0.113.20");

        assertThat(ClientIpUtils.resolveClientIp(request)).isEqualTo("198.51.100.7");
    }

    @Test
    void resolveClientIp_returnsRemoteAddr() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");

        assertThat(ClientIpUtils.resolveClientIp(request)).isEqualTo("127.0.0.1");
    }
}
