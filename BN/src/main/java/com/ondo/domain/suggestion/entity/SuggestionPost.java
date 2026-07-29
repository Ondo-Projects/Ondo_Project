package com.ondo.domain.suggestion.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "suggestion_posts")
@Getter
@NoArgsConstructor
public class SuggestionPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_username", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuggestionCategory category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuggestionStatus status;

    @Column(columnDefinition = "TEXT")
    private String adminReply;

    @Column
    private LocalDateTime repliedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by_username")
    private User repliedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @Builder
    public SuggestionPost(
            User author,
            SuggestionCategory category,
            String title,
            String content,
            SuggestionStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.author = author;
        this.category = category;
        this.title = title;
        this.content = content;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(String title, String content, SuggestionCategory category) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(User user) {
        return author.getUsername().equals(user.getUsername());
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isEditable() {
        return status == SuggestionStatus.OPEN;
    }

    public boolean canTransitionTo(SuggestionStatus newStatus) {
        if (newStatus == status) {
            return false;
        }
        return status != SuggestionStatus.CLOSED;
    }

    public void changeStatus(SuggestionStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public void reply(String reply, User admin) {
        this.adminReply = reply;
        this.repliedAt = LocalDateTime.now();
        this.repliedBy = admin;
        this.updatedAt = LocalDateTime.now();
    }
}
