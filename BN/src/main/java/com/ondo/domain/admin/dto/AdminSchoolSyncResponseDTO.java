package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminSchoolSyncResponseDTO {

    private final int syncedCount;
    private final String message;
}
