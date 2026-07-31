package com.ondo.domain.schoollife.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.meal.service.NeisSchoolMappingService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.schoollife.dto.TimetablePeriodResponseDTO;
import com.ondo.domain.schoollife.dto.TimetableStatus;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.config.NeisProperties;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.NeisMappingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimetableServiceTest {

    private static final String STUDENT_USERNAME = "timetable-service-student";

    @Mock
    private NeisProperties neisProperties;

    @Mock
    private NeisApiClient neisApiClient;

    @Mock
    private NeisSchoolMappingService neisSchoolMappingService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TimetableService timetableService;

    private School school;
    private User student;

    @BeforeEach
    void setUp() {
        school = School.builder()
                .schoolCode("ITTT001")
                .schoolName("시간표테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        student = User.builder()
                .username(STUDENT_USERNAME)
                .password("encoded")
                .role(Role.STUDENT)
                .school(school)
                .name("시간표학생")
                .grade(2)
                .classNumber(3)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
    }

    @Test
    void getTodayTimetable_devMode_returnsSamplePeriods() {
        when(neisProperties.isDevMode()).thenReturn(true);

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.OK);
        assertThat(response.getPeriods()).hasSize(4);
        assertThat(response.getMessage()).contains("개발 모드");
    }

    @Test
    void getTodayTimetable_profileIncomplete_whenGradeMissing() {
        student.updateClassProfile(null, 3);

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.PROFILE_INCOMPLETE);
        assertThat(response.getPeriods()).isEmpty();
    }

    @Test
    void getTodayTimetable_mappingFailed_returnsMappingFailedStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenThrow(new NeisMappingException("NEIS에서 학교 코드를 찾을 수 없습니다."));

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.MAPPING_FAILED);
    }

    @Test
    void getTodayTimetable_noClasses_returnsNoClassesStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchTimetable(anyString(), anyString(), anyString(), any(LocalDate.class), anyInt(), anyInt()))
                .thenReturn(List.of());

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.NO_CLASSES);
    }

    @Test
    void getTodayTimetable_withPeriods_returnsOkStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchTimetable(anyString(), anyString(), anyString(), any(LocalDate.class), anyInt(), anyInt()))
                .thenReturn(List.of(new TimetablePeriodResponseDTO(1, "국어", "1-3")));

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.OK);
        assertThat(response.getPeriods()).hasSize(1);
        assertThat(response.getGrade()).isEqualTo(2);
        assertThat(response.getClassNumber()).isEqualTo(3);
    }

    @Test
    void getTodayTimetable_neisApiError_returnsUnavailableStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchTimetable(anyString(), anyString(), anyString(), any(LocalDate.class), anyInt(), anyInt()))
                .thenThrow(new BusinessException("NEIS API 호출에 실패했습니다."));

        var response = timetableService.getTodayTimetable(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(TimetableStatus.UNAVAILABLE);
    }
}
