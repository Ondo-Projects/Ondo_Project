package com.ondo.domain.announcement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Getter
@RequiredArgsConstructor
public class AnnouncementPageResponseDTO {

    private final List<AnnouncementSummaryDTO> items;
    private final long totalElements;
    private final int page;
    private final int size;
}
