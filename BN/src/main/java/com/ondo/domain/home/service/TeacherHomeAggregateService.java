package com.ondo.domain.home.service;

import com.ondo.domain.counseling.service.CounselingService;
import com.ondo.domain.home.dto.HomeSectionResult;
import com.ondo.domain.home.dto.TeacherHomeAggregateResponseDTO;
import com.ondo.domain.home.support.HomeAggregateSupport;
import com.ondo.domain.precounseling.service.PreCounselingProfileService;
import com.ondo.domain.suggestion.service.SuggestionService;
import com.ondo.domain.user.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherHomeAggregateService {

    private final CounselingService counselingService;
    private final PreCounselingProfileService preCounselingProfileService;
    private final SuggestionService suggestionService;

    public TeacherHomeAggregateResponseDTO loadHome(String username) {
        HomeSectionResult<Long> unreadResult = HomeAggregateSupport.loadSafely(
                () -> counselingService.getTeacherUnreadCount(username),
                "읽지 않은 상담 수를 불러오지 못했습니다."
        );
        HomeSectionResult<java.util.List<com.ondo.domain.counseling.dto.CounselingResponseDTO>> postsResult =
                HomeAggregateSupport.loadSafely(
                        () -> counselingService.getTeacherPosts(username, null),
                        "상담 목록을 불러오지 못했습니다."
                );
        HomeSectionResult<java.util.List<com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO>> preCounselResult =
                HomeAggregateSupport.loadSafely(
                        () -> preCounselingProfileService.getAssignedStudentSummaries(username),
                        "사전 상담 목록을 불러오지 못했습니다."
                );
        HomeSectionResult<java.util.List<com.ondo.domain.suggestion.dto.SuggestionResponseDTO>> suggestionsResult =
                HomeAggregateSupport.loadSafely(
                        () -> suggestionService.getMyPosts(username, Role.TEACHER),
                        "건의 목록을 불러오지 못했습니다."
                );

        return TeacherHomeAggregateResponseDTO.builder()
                .unreadCount(unreadResult.getValue())
                .unreadCountError(unreadResult.getError())
                .counselingPosts(postsResult.getValue())
                .counselingPostsError(postsResult.getError())
                .preCounselSummaries(preCounselResult.getValue())
                .preCounselSummariesError(preCounselResult.getError())
                .suggestions(suggestionsResult.getValue())
                .suggestionsError(suggestionsResult.getError())
                .build();
    }
}
