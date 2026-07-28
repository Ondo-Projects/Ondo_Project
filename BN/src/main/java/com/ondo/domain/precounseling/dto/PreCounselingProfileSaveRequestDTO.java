package com.ondo.domain.precounseling.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PreCounselingProfileSaveRequestDTO {

    @NotBlank(message = "학생 연락처를 입력해 주세요.")
    @Size(max = 20)
    private String studentPhone;

    @NotBlank(message = "부모님 연락처를 입력해 주세요.")
    @Size(max = 20)
    private String parentPhone;

    @Size(max = 10)
    private String mbti;

    @NotBlank(message = "장래희망을 입력해 주세요.")
    @Size(max = 200)
    private String futureHope;

    @NotBlank(message = "좌우명이나 좋아하는 단어를 입력해 주세요.")
    private String favoriteWords;

    @NotBlank(message = "나의 장점을 입력해 주세요.")
    private String personalityStrength;

    @NotBlank(message = "나의 단점을 입력해 주세요.")
    private String personalityWeakness;

    @NotBlank(message = "취미, 특기, 관심사를 입력해 주세요.")
    private String hobbiesSpecialtiesInterests;

    @NotBlank(message = "가장 행복할 때를 입력해 주세요.")
    private String happiestMoment;

    @NotBlank(message = "가장 스트레스받을 때를 입력해 주세요.")
    private String stressfulMoment;

    @NotBlank(message = "스트레스 해소 방법을 입력해 주세요.")
    private String stressReliefMethod;

    @NotBlank(message = "작년 학교생활 기억을 입력해 주세요.")
    private String memorableSchoolMoment;

    @NotBlank(message = "친해지고 싶은 친구 유형을 입력해 주세요.")
    private String desiredFriendType;

    @NotBlank(message = "올해 해보고 싶은 역할을 입력해 주세요.")
    private String desiredClassRole;
}
