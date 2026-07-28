package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminNeisSyncResponseDTO {

    private final int processedCount;
    private final int successCount;
    private final int failedCount;
    private final String message;
}
