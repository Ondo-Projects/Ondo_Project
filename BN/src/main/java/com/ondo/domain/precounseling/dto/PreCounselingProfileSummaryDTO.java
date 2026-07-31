package com.ondo.domain.precounseling.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class PreCounselingProfileSummaryDTO {

    private final String studentUsername;
    private final String studentName;
    private final boolean completed;
    private final String updatedAt;
}
