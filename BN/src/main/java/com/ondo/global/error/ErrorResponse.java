package com.ondo.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErrorResponse {

    private final String message;

    public static ErrorResponse of(String message) {
        return new ErrorResponse(message);
    }
}
