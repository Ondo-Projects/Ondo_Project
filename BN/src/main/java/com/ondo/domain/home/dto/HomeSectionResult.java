package com.ondo.domain.home.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class HomeSectionResult<T> {

    private final T value;
    private final String error;

    public static <T> HomeSectionResult<T> ok(T value) {
        return new HomeSectionResult<>(value, null);
    }

    public static <T> HomeSectionResult<T> fail(String error) {
        return new HomeSectionResult<>(null, error);
    }
}
