package com.ondo.global.web;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpUtils {

    private ClientIpUtils() {
    }

    /**
     * 실제 클라이언트 IP.
     * <p>
     * X-Forwarded-For 를 직접 읽지 않습니다. 맨 앞 값은 클라이언트가 마음대로 넣을 수 있어
     * IP별 SMS·인증번호 발송 제한을 우회할 수 있기 때문입니다.
     * nginx 뒤에서는 server.forward-headers-strategy=native (Tomcat RemoteIpValve)가
     * 신뢰할 수 있는 프록시(127.0.0.1 등)가 붙인 값만 반영해 getRemoteAddr() 를 채워 줍니다.
     */
    public static String resolveClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
