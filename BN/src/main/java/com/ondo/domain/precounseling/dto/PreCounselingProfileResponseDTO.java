package com.ondo.domain.precounseling.dto;

import com.ondo.domain.precounseling.entity.StudentPreCounselingProfile;
import com.ondo.domain.user.entity.User;
import com.ondo.global.crypto.FieldEncryptionService;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class PreCounselingProfileResponseDTO {

    private final boolean completed;
    private final String studentUsername;
    private final String studentName;
    private final LocalDate birthDate;
    private final String studentPhone;
    private final String parentPhone;
    private final String mbti;
    private final String futureHope;
    private final String favoriteWords;
    private final String personalityStrength;
    private final String personalityWeakness;
    private final String hobbiesSpecialtiesInterests;
    private final String happiestMoment;
    private final String stressfulMoment;
    private final String stressReliefMethod;
    private final String memorableSchoolMoment;
    private final String desiredFriendType;
    private final String desiredClassRole;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    private PreCounselingProfileResponseDTO(
            boolean completed,
            String studentUsername,
            String studentName,
            LocalDate birthDate,
            String studentPhone,
            String parentPhone,
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
        this.completed = completed;
        this.studentUsername = studentUsername;
        this.studentName = studentName;
        this.birthDate = birthDate;
        this.studentPhone = studentPhone;
        this.parentPhone = parentPhone;
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

    public static PreCounselingProfileResponseDTO empty(User student) {
        return new PreCounselingProfileResponseDTO(
                false,
                student.getUsername(),
                student.getName(),
                student.getBirthDate(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public static PreCounselingProfileResponseDTO from(
            User student,
            StudentPreCounselingProfile profile,
            FieldEncryptionService encryptionService
    ) {
        return new PreCounselingProfileResponseDTO(
                true,
                student.getUsername(),
                student.getName(),
                student.getBirthDate(),
                encryptionService.decrypt(profile.getStudentPhoneEncrypted()),
                encryptionService.decrypt(profile.getParentPhoneEncrypted()),
                profile.getMbti(),
                profile.getFutureHope(),
                profile.getFavoriteWords(),
                profile.getPersonalityStrength(),
                profile.getPersonalityWeakness(),
                profile.getHobbiesSpecialtiesInterests(),
                profile.getHappiestMoment(),
                profile.getStressfulMoment(),
                profile.getStressReliefMethod(),
                profile.getMemorableSchoolMoment(),
                profile.getDesiredFriendType(),
                profile.getDesiredClassRole(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
