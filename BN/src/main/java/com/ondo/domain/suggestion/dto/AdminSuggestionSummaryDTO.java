package com.ondo.domain.suggestion.dto;

import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.user.entity.Role;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AdminSuggestionSummaryDTO {

    private final Long id;
    private final SuggestionCategory category;
    private final String title;
    private final SuggestionStatus status;
    private final String authorUsername;
    private final String authorName;
    private final Role authorRole;
    private final LocalDateTime createdAt;
    private final boolean hasAdminReply;

    public static AdminSuggestionSummaryDTO from(SuggestionPost post) {
        return new AdminSuggestionSummaryDTO(
                post.getId(),
                post.getCategory(),
                post.getTitle(),
                post.getStatus(),
                post.getAuthor().getUsername(),
                post.getAuthor().getName(),
                post.getAuthor().getRole(),
                post.getCreatedAt(),
                post.getAdminReply() != null && !post.getAdminReply().isBlank()
        );
    }
}
