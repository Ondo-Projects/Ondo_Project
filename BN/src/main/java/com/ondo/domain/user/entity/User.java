package com.ondo.domain.user.entity;

import com.ondo.domain.school.entity.School;
import com.ondo.global.crypto.EncryptedStringConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

    /** 보호자 휴대전화 — AES-256-GCM 암호문으로 저장 (예전 평문 칸 guardian_phone 은 UserPhoneEncryptionMigration 이 옮김) */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "guardian_phone_encrypted", length = 512)
    private String guardianPhone;

    /** 교사 알림용 휴대전화 — AES-256-GCM 암호문으로 저장 (예전 평문 칸 phone 은 UserPhoneEncryptionMigration 이 옮김) */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "phone_encrypted", length = 512)
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

    /** 가입 때 동의한 이용약관 버전(시행일). 이 기능 도입 전 가입자는 null */
    @Column(length = 20)
    private String agreedTermsVersion;

    /** 가입 때 동의한 개인정보처리방침·동의서 버전(시행일). 이 기능 도입 전 가입자는 null */
    @Column(length = 20)
    private String agreedPrivacyVersion;

    @Column(nullable = false, columnDefinition = "bit(1) not null default b'1'")
    private boolean active = true;

    @Column
    private LocalDateTime withdrawnAt;

    /** 탈퇴 후 보관 기간이 지나 개인정보를 파기한 시각 (교사 계정은 기록 연결용 빈 껍데기만 남음) */
    @Column
    private LocalDateTime purgedAt;

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
            String agreedTermsVersion,
            String agreedPrivacyVersion,
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
        this.agreedTermsVersion = agreedTermsVersion;
        this.agreedPrivacyVersion = agreedPrivacyVersion;
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

    /**
     * 탈퇴 교사 계정의 개인정보를 지우고, 상담 기록의 연결만 남깁니다.
     * 학생이 남긴 상담 글이 이 계정을 담당 교사로 가리키고 있어 행 자체는 지울 수 없습니다.
     */
    public void anonymizeAfterPurge(String unusableEncodedPassword, LocalDateTime purgedAt) {
        if (this.active) {
            throw new IllegalStateException("active account cannot be purged");
        }
        changePassword(unusableEncodedPassword);
        this.name = "탈퇴한 회원";
        this.birthDate = null;
        this.email = null;
        this.phone = null;
        this.smsNotifyEnabled = false;
        this.guardianName = null;
        this.guardianPhone = null;
        this.guardianRelation = null;
        this.grade = null;
        this.classNumber = null;
        this.purgedAt = purgedAt;
    }
}
