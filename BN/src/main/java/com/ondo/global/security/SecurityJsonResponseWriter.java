package com.ondo.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.global.error.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public final class SecurityJsonResponseWriter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private SecurityJsonResponseWriter() {
    }

    public static void write(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(ErrorResponse.of(message)));
    }
}
