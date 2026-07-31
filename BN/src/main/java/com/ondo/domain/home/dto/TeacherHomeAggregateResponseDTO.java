package com.ondo.domain.home.dto;

import com.ondo.domain.counseling.dto.CounselingResponseDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO;
import com.ondo.domain.suggestion.dto.SuggestionResponseDTO;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TeacherHomeAggregateResponseDTO {

    private final Long unreadCount;
    private final String unreadCountError;
    private final List<CounselingResponseDTO> counselingPosts;
    private final String counselingPostsError;
    private final List<PreCounselingProfileSummaryDTO> preCounselSummaries;
    private final String preCounselSummariesError;
    private final List<SuggestionResponseDTO> suggestions;
    private final String suggestionsError;
}
