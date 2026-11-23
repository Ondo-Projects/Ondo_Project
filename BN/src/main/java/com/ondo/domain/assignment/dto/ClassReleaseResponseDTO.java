package com.ondo.domain.assignment.dto;

import lombok.Getter;

/** 학급 연결 해제 결과 */
@Getter
public class ClassReleaseResponseDTO {

    /** 연결을 푼 학생 수 */
    private final int releasedStudents;
    /** 함께 취소된 끝나지 않은 상담 수 */
    private final int cancelledCounselings;
    /** 학급 전체를 정리한 경우 새로 발급한 초대코드 (한 명만 해제하면 null) */
    private final String newInviteCode;

    public ClassReleaseResponseDTO(int releasedStudents, int cancelledCounselings, String newInviteCode) {
        this.releasedStudents = releasedStudents;
        this.cancelledCounselings = cancelledCounselings;
        this.newInviteCode = newInviteCode;
    }
}
