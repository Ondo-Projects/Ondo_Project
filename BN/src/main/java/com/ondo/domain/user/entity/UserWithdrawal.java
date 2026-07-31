package com.ondo.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_withdrawals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserWithdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 50)
    private String reason;

    @Column(length = 500)
    private String reasonDetail;

    @Column(nullable = false)
    private LocalDateTime withdrawnAt;

    @Builder
    public UserWithdrawal(
            String username,
            Role role,
            String reason,
            String reasonDetail,
            LocalDateTime withdrawnAt
    ) {
        this.username = username;
        this.role = role;
        this.reason = reason;
        this.reasonDetail = reasonDetail;
        this.withdrawnAt = withdrawnAt;
    }
}
