package com.ondo.domain.user.entity;

import com.ondo.domain.school.entity.School;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_code", nullable = false)
    private School school;

    @Column(length = 50)
    private String name;

    @Column
    private LocalDate birthDate;

    @Column(length = 100)
    private String email;

    @Column(length = 50)
    private String guardianName;

    @Column(length = 20)
    private String guardianPhone;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, columnDefinition = "bit(1) not null default b'0'")
    private boolean smsNotifyEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private GuardianRelation guardianRelation;

    @Column
    private boolean agreeGuardianChildPrivacy;

    @Column
    private boolean agreeGuardianChildSensitive;

    @Column
    private boolean agreeGuardianIdentity;

    @Column
    private LocalDateTime guardianAgreedAt;

    @Column(nullable = false)
    private boolean agreeService;

    @Column(nullable = false)
    private boolean agreePrivacy;

    @Column(nullable = false)
    private boolean agreeSensitive;

    @Column(nullable = false)
    private LocalDateTime agreedAt;

    @Column(nullable = false, columnDefinition = "bit(1) not null default b'1'")
    private boolean active = true;

    @Column
    private LocalDateTime withdrawnAt;

    @Column
    private Integer grade;

    @Column
    private Integer classNumber;

    @Builder
    public User(
            String username,
            String password,
            Role role,
            School school,
            String name,
            LocalDate birthDate,
            String email,
            String guardianName,
            String guardianPhone,
            String phone,
            Boolean smsNotifyEnabled,
            GuardianRelation guardianRelation,
            boolean agreeGuardianChildPrivacy,
            boolean agreeGuardianChildSensitive,
            boolean agreeGuardianIdentity,
            LocalDateTime guardianAgreedAt,
            boolean agreeService,
            boolean agreePrivacy,
            boolean agreeSensitive,
            LocalDateTime agreedAt,
            Boolean active,
            LocalDateTime withdrawnAt,
            Integer grade,
            Integer classNumber
    ) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.school = school;
        this.name = name;
        this.birthDate = birthDate;
        this.email = email;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.phone = phone;
        this.smsNotifyEnabled = smsNotifyEnabled != null && smsNotifyEnabled;
        this.guardianRelation = guardianRelation;
        this.agreeGuardianChildPrivacy = agreeGuardianChildPrivacy;
        this.agreeGuardianChildSensitive = agreeGuardianChildSensitive;
        this.agreeGuardianIdentity = agreeGuardianIdentity;
        this.guardianAgreedAt = guardianAgreedAt;
        this.agreeService = agreeService;
        this.agreePrivacy = agreePrivacy;
        this.agreeSensitive = agreeSensitive;
        this.agreedAt = agreedAt;
        this.active = active != null ? active : true;
        this.withdrawnAt = withdrawnAt;
        this.grade = grade;
        this.classNumber = classNumber;
    }

    public void changeSchool(School school) {
        if (school == null) {
            throw new IllegalArgumentException("school must not be null");
        }
        this.school = school;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }

    public void updateClassProfile(Integer grade, Integer classNumber) {
        this.grade = grade;
        this.classNumber = classNumber;
    }

    public void updateNotificationSettings(String phone, boolean smsNotifyEnabled) {
        this.phone = phone;
        this.smsNotifyEnabled = smsNotifyEnabled;
    }

    public void changePassword(String encodedPassword) {
        if (encodedPassword == null || encodedPassword.isBlank()) {
            throw new IllegalArgumentException("encodedPassword must not be blank");
        }
        this.password = encodedPassword;
    }

    public void withdraw(LocalDateTime withdrawnAt) {
        if (withdrawnAt == null) {
            throw new IllegalArgumentException("withdrawnAt must not be null");
        }
        if (!this.active) {
            throw new IllegalStateException("already withdrawn or inactive");
        }
        this.active = false;
        this.withdrawnAt = withdrawnAt;
    }
}
