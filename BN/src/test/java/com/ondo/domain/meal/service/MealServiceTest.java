package com.ondo.domain.meal.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.MealDayStatus;
import com.ondo.domain.meal.dto.MealItemResponseDTO;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.school.entity.School;
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
class MealServiceTest {

    private static final String STUDENT_USERNAME = "meal-service-student";

    @Mock
    private NeisProperties neisProperties;

    @Mock
    private NeisApiClient neisApiClient;

    @Mock
    private NeisSchoolMappingService neisSchoolMappingService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MealService mealService;

    private School school;
    private User student;

    @BeforeEach
    void setUp() {
        school = School.builder()
                .schoolCode("ITML001")
                .schoolName("급식테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        student = User.builder()
                .username(STUDENT_USERNAME)
                .password("encoded")
                .role(Role.STUDENT)
                .school(school)
                .name("급식학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
    }

    @Test
    void getTodayMeals_devMode_returnsOkSample() {
        when(neisProperties.isDevMode()).thenReturn(true);

        var response = mealService.getTodayMeals(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(MealDayStatus.OK);
        assertThat(response.getMeals()).hasSize(2);
        assertThat(response.getMessage()).contains("개발 모드");
    }

    @Test
    void getTodayMeals_mappingFailed_returnsMappingFailedStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenThrow(new NeisMappingException("NEIS에서 학교 코드를 찾을 수 없습니다."));

        var response = mealService.getTodayMeals(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(MealDayStatus.MAPPING_FAILED);
        assertThat(response.getMeals()).isEmpty();
        assertThat(response.getMessage()).contains("학교 코드 연동");
    }

    @Test
    void getTodayMeals_noMeals_returnsNoMealsStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchMeals(any(), any(), any(LocalDate.class))).thenReturn(List.of());

        var response = mealService.getTodayMeals(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(MealDayStatus.NO_MEALS);
        assertThat(response.getMessage()).isEqualTo("오늘 등록된 급식 정보가 없습니다.");
    }

    @Test
    void getTodayMeals_neisApiError_returnsUnavailableStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchMeals(any(), any(), any(LocalDate.class)))
                .thenThrow(new BusinessException("NEIS API 호출에 실패했습니다."));

        var response = mealService.getTodayMeals(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(MealDayStatus.UNAVAILABLE);
        assertThat(response.getMessage()).contains("일시적으로");
    }

    @Test
    void getTodayMeals_withMeals_returnsOkStatus() {
        when(neisProperties.isDevMode()).thenReturn(false);
        when(neisSchoolMappingService.resolveNeisCodes(school))
                .thenReturn(new NeisSchoolCodeDTO("B10", "7130166"));
        when(neisApiClient.fetchMeals(any(), any(), any(LocalDate.class)))
                .thenReturn(List.of(new MealItemResponseDTO("중식", 2, "· 밥", "500 Kcal")));

        var response = mealService.getTodayMeals(STUDENT_USERNAME);

        assertThat(response.getStatus()).isEqualTo(MealDayStatus.OK);
        assertThat(response.getMeals()).hasSize(1);
        assertThat(response.getMessage()).isNull();
    }
}
