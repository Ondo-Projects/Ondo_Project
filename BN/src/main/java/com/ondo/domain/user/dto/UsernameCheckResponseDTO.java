package com.ondo.domain.user.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UsernameCheckResponseDTO {

    private final boolean available;
    private final String message;
}
