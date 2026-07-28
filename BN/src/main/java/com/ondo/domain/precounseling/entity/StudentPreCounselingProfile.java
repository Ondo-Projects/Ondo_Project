package com.ondo.domain.precounseling.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_pre_counseling_profiles")
@Getter
@NoArgsConstructor
public class StudentPreCounselingProfile {

    @Id
    @Column(name = "student_username", length = 50)
    private String studentUsername;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username")
    private User student;

    @Column(name = "student_phone_encrypted", length = 512)
    private String studentPhoneEncrypted;

    @Column(name = "parent_phone_encrypted", length = 512)
    private String parentPhoneEncrypted;

    @Column(length = 10)
    private String mbti;

    @Column(nullable = false, length = 200)
    private String futureHope;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String favoriteWords;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String personalityStrength;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String personalityWeakness;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String hobbiesSpecialtiesInterests;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String happiestMoment;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String stressfulMoment;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String stressReliefMethod;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String memorableSchoolMoment;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String desiredFriendType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String desiredClassRole;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public StudentPreCounselingProfile(
            User student,
            String studentPhoneEncrypted,
            String parentPhoneEncrypted,
            String mbti,
            String futureHope,
            String favoriteWords,
            String personalityStrength,
            String personalityWeakness,
            String hobbiesSpecialtiesInterests,
            String happiestMoment,
            String stressfulMoment,
            String stressReliefMethod,
            String memorableSchoolMoment,
            String desiredFriendType,
            String desiredClassRole,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.student = student;
        this.studentPhoneEncrypted = studentPhoneEncrypted;
        this.parentPhoneEncrypted = parentPhoneEncrypted;
        this.mbti = mbti;
        this.futureHope = futureHope;
        this.favoriteWords = favoriteWords;
        this.personalityStrength = personalityStrength;
        this.personalityWeakness = personalityWeakness;
        this.hobbiesSpecialtiesInterests = hobbiesSpecialtiesInterests;
        this.happiestMoment = happiestMoment;
        this.stressfulMoment = stressfulMoment;
        this.stressReliefMethod = stressReliefMethod;
        this.memorableSchoolMoment = memorableSchoolMoment;
        this.desiredFriendType = desiredFriendType;
        this.desiredClassRole = desiredClassRole;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(
            String studentPhoneEncrypted,
            String parentPhoneEncrypted,
            String mbti,
            String futureHope,
            String favoriteWords,
            String personalityStrength,
            String personalityWeakness,
            String hobbiesSpecialtiesInterests,
            String happiestMoment,
            String stressfulMoment,
            String stressReliefMethod,
            String memorableSchoolMoment,
            String desiredFriendType,
            String desiredClassRole
    ) {
        this.studentPhoneEncrypted = studentPhoneEncrypted;
        this.parentPhoneEncrypted = parentPhoneEncrypted;
        this.mbti = mbti;
        this.futureHope = futureHope;
        this.favoriteWords = favoriteWords;
        this.personalityStrength = personalityStrength;
        this.personalityWeakness = personalityWeakness;
        this.hobbiesSpecialtiesInterests = hobbiesSpecialtiesInterests;
        this.happiestMoment = happiestMoment;
        this.stressfulMoment = stressfulMoment;
        this.stressReliefMethod = stressReliefMethod;
        this.memorableSchoolMoment = memorableSchoolMoment;
        this.desiredFriendType = desiredFriendType;
        this.desiredClassRole = desiredClassRole;
        this.updatedAt = LocalDateTime.now();
    }
}
