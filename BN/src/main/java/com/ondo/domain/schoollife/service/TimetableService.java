package com.ondo.domain.schoollife.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.meal.service.NeisSchoolMappingService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.schoollife.dto.TimetableDayResponseDTO;
import com.ondo.domain.schoollife.dto.TimetablePeriodResponseDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.config.NeisProperties;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.NeisMappingException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetableService {

    private static final String NO_CLASSES_MESSAGE = "오늘 등록된 시간표가 없습니다.";
    private static final String PROFILE_INCOMPLETE_MESSAGE =
            "학년·반을 입력하면 시간표를 볼 수 있습니다.";
    private static final String MAPPING_FAILED_MESSAGE =
            "시간표를 불러오기 위한 학교 코드 연동에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    private static final String UNAVAILABLE_MESSAGE =
            "시간표를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";

    private final NeisProperties neisProperties;
    private final NeisApiClient neisApiClient;
    private final NeisSchoolMappingService neisSchoolMappingService;
    private final UserRepository userRepository;

    public TimetableDayResponseDTO getTodayTimetable(String username) {
        User student = getStudent(username);
        School school = student.getSchool();
        LocalDate today = LocalDate.now();
        String schoolName = school.getSchoolName();

        Integer grade = student.getGrade();
        Integer classNumber = student.getClassNumber();
        if (grade == null || classNumber == null) {
            return TimetableDayResponseDTO.profileIncomplete(today, schoolName, PROFILE_INCOMPLETE_MESSAGE);
        }

        if (neisProperties.isDevMode()) {
            return sampleTimetable(today, schoolName, grade, classNumber);
        }

        NeisSchoolCodeDTO neisCodes;
        try {
            neisCodes = neisSchoolMappingService.resolveNeisCodes(school);
        } catch (NeisMappingException exception) {
            return TimetableDayResponseDTO.mappingFailed(today, schoolName, MAPPING_FAILED_MESSAGE);
        }

        List<TimetablePeriodResponseDTO> periods;
        try {
            periods = neisApiClient.fetchTimetable(
                    neisCodes.getOfficeCode(),
                    neisCodes.getSchoolCode(),
                    school.getSchoolType(),
                    today,
                    grade,
                    classNumber
            );
        } catch (BusinessException exception) {
            return TimetableDayResponseDTO.unavailable(today, schoolName, UNAVAILABLE_MESSAGE);
        }

        if (periods.isEmpty()) {
            return TimetableDayResponseDTO.noClasses(today, schoolName, grade, classNumber, NO_CLASSES_MESSAGE);
        }

        return TimetableDayResponseDTO.ok(today, schoolName, grade, classNumber, periods, null);
    }

    private TimetableDayResponseDTO sampleTimetable(
            LocalDate date,
            String schoolName,
            Integer grade,
            Integer classNumber
    ) {
        List<TimetablePeriodResponseDTO> periods = List.of(
                new TimetablePeriodResponseDTO(1, "국어", "1-" + classNumber),
                new TimetablePeriodResponseDTO(2, "수학", "1-" + classNumber),
                new TimetablePeriodResponseDTO(3, "영어", "1-" + classNumber),
                new TimetablePeriodResponseDTO(4, "과학", "2-" + classNumber)
        );
        return TimetableDayResponseDTO.ok(
                date,
                schoolName,
                grade,
                classNumber,
                periods,
                "개발 모드 샘플 시간표입니다."
        );
    }

    private User getStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("학생만 시간표를 조회할 수 있습니다.");
        }
        return user;
    }
}
