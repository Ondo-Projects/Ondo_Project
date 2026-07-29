package com.ondo.domain.suggestion.dto;

import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.user.entity.Role;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SuggestionResponseDTO {

    private final Long id;
    private final SuggestionCategory category;
    private final String title;
    private final String content;
    private final SuggestionStatus status;
    private final String authorUsername;
    private final String authorName;
    private final Role authorRole;
    private final String adminReply;
    private final LocalDateTime repliedAt;
    private final String repliedByUsername;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public SuggestionResponseDTO(SuggestionPost post) {
        this.id = post.getId();
        this.category = post.getCategory();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.status = post.getStatus();
        this.authorUsername = post.getAuthor().getUsername();
        this.authorName = post.getAuthor().getName();
        this.authorRole = post.getAuthor().getRole();
        this.adminReply = post.getAdminReply();
        this.repliedAt = post.getRepliedAt();
        this.repliedByUsername = post.getRepliedBy() != null ? post.getRepliedBy().getUsername() : null;
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
}
