package com.ondo.domain.counseling.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "counseling_access_logs")
@Getter
@NoArgsConstructor
public class CounselingAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counseling_post_id", nullable = false)
    private CounselingPost counselingPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_username", nullable = false)
    private User teacher;

    @Column(nullable = false)
    private LocalDateTime accessedAt;

    @Builder
    public CounselingAccessLog(CounselingPost counselingPost, User teacher, LocalDateTime accessedAt) {
        this.counselingPost = counselingPost;
        this.teacher = teacher;
        this.accessedAt = accessedAt;
    }
}
