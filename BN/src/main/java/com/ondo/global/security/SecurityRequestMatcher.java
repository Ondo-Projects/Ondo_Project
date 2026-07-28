package com.ondo.global.security;

import jakarta.servlet.http.HttpServletRequest;

public final class SecurityRequestMatcher {

    private SecurityRequestMatcher() {
    }

    public static boolean isApiRequest(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        return requestUri != null && requestUri.startsWith("/api/");
    }
}
