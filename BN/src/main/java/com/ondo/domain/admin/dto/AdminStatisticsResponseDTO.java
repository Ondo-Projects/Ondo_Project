package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@Getter
@RequiredArgsConstructor
public class AdminStatisticsResponseDTO {

    private final Map<String, Long> counselingByStatus;
    private final Map<String, Long> moodByLevelLast7Days;
}
