package com.ondo.domain.schoollife.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.meal.service.NeisSchoolMappingService;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.schoollife.dto.SchoolScheduleItemResponseDTO;
import com.ondo.domain.schoollife.dto.SchoolScheduleStatus;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchoolScheduleServiceTest {

    private static final String STUDENT_USERNAME = "schedule-service-student";
    private static final String TEACHER_USERNAME = "schedule-service-teacher";

    @Mock
    private NeisProperties neisProperties;

    @Mock
    private NeisApiClient neisApiClient;

    @Mock
    private NeisSchoolMappingService neisSchoolMappingService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SchoolScheduleService schoolScheduleService;

    private School school;
    private User student;
    private User teacher;

    @BeforeEach
    void setUp() {
        school = School.builder()
                .schoolCode("ITSC001")
                .schoolName("학사일정테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        student = User.builder()
                .username(STUDENT_USERNAME)
                .password("encoded")
                .role(Role.STUDENT)
                .school(school)
                .name("학사일정학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        teacher = User.builder()
                .username(TEACHER_USERNAME)
                .password("encoded")
                .role(Role.TEACHER)
                .school(school)
                .name("학사일정교사")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();
    }

    @Test
    void getUpcomingScheduleForHome_devMode_returnsSampleEvents() {
        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
        when(neisProperties.isDevMode()).thenReturn(true);

        var response = schoolScheduleService.getUpcomingScheduleForHome(STUDENT_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.OK);
        assertThat(response.getEvents()).hasSize(3);
        assertThat(response.getMessage()).contains("개발 모드");
    }

    @Test
    void getUpcomingScheduleForHome_teacher_devMode_returnsSampleEvents() {
        when(userRepository.findByUsername(TEACHER_USERNAME)).thenReturn(Optional.of(teacher));
        when(neisProperties.isDevMode()).thenReturn(true);

        var response = schoolScheduleService.getUpcomingScheduleForHome(TEACHER_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.OK);
        assertThat(response.getEvents()).isNotEmpty();
    }

    @Test
    void getUpcomingScheduleForHome_mappingFailed_returnsMappingFailedStatus() {
        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenThrow(new NeisMappingException("NEIS에서 학교 코드를 찾을 수 없습니다."));

        var response = schoolScheduleService.getUpcomingScheduleForHome(STUDENT_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.MAPPING_FAILED);
        assertThat(response.getEvents()).isEmpty();
        assertThat(response.getMessage()).contains("학교 코드 연동");
    }

    @Test
    void getUpcomingScheduleForHome_noEvents_returnsNoEventsStatus() {
        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchSchoolSchedule(any(), any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        var response = schoolScheduleService.getUpcomingScheduleForHome(STUDENT_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.NO_EVENTS);
        assertThat(response.getMessage()).isEqualTo("다가오는 학사일정이 없습니다.");
    }

    @Test
    void getUpcomingScheduleForHome_neisApiError_returnsUnavailableStatus() {
        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchSchoolSchedule(any(), any(), any(LocalDate.class), any(LocalDate.class)))
                .thenThrow(new BusinessException("NEIS API 호출에 실패했습니다."));

        var response = schoolScheduleService.getUpcomingScheduleForHome(STUDENT_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.UNAVAILABLE);
        assertThat(response.getMessage()).contains("일시적으로");
    }

    @Test
    void getUpcomingScheduleForHome_withEvents_returnsOkStatus() {
        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchSchoolSchedule(any(), any(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new SchoolScheduleItemResponseDTO(LocalDate.now(), "체육대회", "운동장")
                ));

        var response = schoolScheduleService.getUpcomingScheduleForHome(STUDENT_USERNAME, 14);

        assertThat(response.getStatus()).isEqualTo(SchoolScheduleStatus.OK);
        assertThat(response.getEvents()).hasSize(1);
        assertThat(response.getMessage()).isNull();
    }
}
