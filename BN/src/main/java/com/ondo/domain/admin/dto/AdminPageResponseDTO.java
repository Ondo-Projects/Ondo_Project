package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Getter
@RequiredArgsConstructor
public class AdminPageResponseDTO<T> {

    private final List<T> items;
    private final long totalElements;
    private final int page;
    private final int size;
}
