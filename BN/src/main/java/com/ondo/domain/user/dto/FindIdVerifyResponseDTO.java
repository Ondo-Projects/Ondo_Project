package com.ondo.domain.user.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class FindIdVerifyResponseDTO {

    private final String username;
    private final String maskedUsername;
    private final String message;
}
