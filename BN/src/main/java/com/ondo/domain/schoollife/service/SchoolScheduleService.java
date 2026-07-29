package com.ondo.domain.schoollife.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.meal.service.NeisSchoolMappingService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.schoollife.dto.SchoolScheduleItemResponseDTO;
import com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO;
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
public class SchoolScheduleService {

    private static final int MIN_DAYS = 1;
    private static final int MAX_DAYS = 31;

    private static final String NO_EVENTS_MESSAGE = "다가오는 학사일정이 없습니다.";
    private static final String MAPPING_FAILED_MESSAGE =
            "학사일정을 불러오기 위한 학교 코드 연동에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    private static final String UNAVAILABLE_MESSAGE =
            "학사일정을 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";

    private final NeisProperties neisProperties;
    private final NeisApiClient neisApiClient;
    private final NeisSchoolMappingService neisSchoolMappingService;
    private final UserRepository userRepository;

    public SchoolScheduleUpcomingResponseDTO getUpcomingScheduleForHome(String username, int days) {
        User user = getUserWithAnyRole(username, Role.STUDENT, Role.TEACHER);
        return fetchUpcomingSchedule(user.getSchool(), days);
    }

    private SchoolScheduleUpcomingResponseDTO fetchUpcomingSchedule(School school, int days) {
        int boundedDays = Math.min(Math.max(days, MIN_DAYS), MAX_DAYS);
        LocalDate fromDate = LocalDate.now();
        LocalDate toDate = fromDate.plusDays(boundedDays - 1L);
        String schoolName = school.getSchoolName();

        if (neisProperties.isDevMode()) {
            return sampleSchedule(schoolName, fromDate, toDate);
        }

        NeisSchoolCodeDTO neisCodes;
        try {
            neisCodes = neisSchoolMappingService.resolveNeisCodes(school);
        } catch (NeisMappingException exception) {
            return SchoolScheduleUpcomingResponseDTO.mappingFailed(
                    schoolName,
                    fromDate,
                    toDate,
                    MAPPING_FAILED_MESSAGE
            );
        }

        List<SchoolScheduleItemResponseDTO> events;
        try {
            events = neisApiClient.fetchSchoolSchedule(
                    neisCodes.getOfficeCode(),
                    neisCodes.getSchoolCode(),
                    fromDate,
                    toDate
            );
        } catch (BusinessException exception) {
            return SchoolScheduleUpcomingResponseDTO.unavailable(
                    schoolName,
                    fromDate,
                    toDate,
                    UNAVAILABLE_MESSAGE
            );
        }

        if (events.isEmpty()) {
            return SchoolScheduleUpcomingResponseDTO.noEvents(
                    schoolName,
                    fromDate,
                    toDate,
                    NO_EVENTS_MESSAGE
            );
        }

        return SchoolScheduleUpcomingResponseDTO.ok(schoolName, fromDate, toDate, events, null);
    }

    private SchoolScheduleUpcomingResponseDTO sampleSchedule(
            String schoolName,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        List<SchoolScheduleItemResponseDTO> events = List.of(
                new SchoolScheduleItemResponseDTO(fromDate, "학교 행사", "전교생 참석"),
                new SchoolScheduleItemResponseDTO(fromDate.plusDays(2), "체육대회", "운동장"),
                new SchoolScheduleItemResponseDTO(fromDate.plusDays(5), "중간고사", "1~3교시")
        );
        return SchoolScheduleUpcomingResponseDTO.ok(
                schoolName,
                fromDate,
                toDate,
                events,
                "개발 모드 샘플 학사일정입니다."
        );
    }

    private User getUserWithAnyRole(String username, Role... roles) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        for (Role role : roles) {
            if (user.getRole() == role) {
                return user;
            }
        }
        throw new BusinessException("학사일정을 조회할 수 없습니다.");
    }
}
