package com.ondo.domain.meal.service;

import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.meal.dto.MealDayResponseDTO;
import com.ondo.domain.meal.dto.MealItemResponseDTO;
import com.ondo.domain.meal.dto.NeisSchoolCodeDTO;
import com.ondo.domain.school.entity.School;
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
public class MealService {

    private static final String NO_MEALS_MESSAGE = "오늘 등록된 급식 정보가 없습니다.";
    private static final String MAPPING_FAILED_MESSAGE =
            "급식 정보를 불러오기 위한 학교 코드 연동에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    private static final String UNAVAILABLE_MESSAGE =
            "급식 정보를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";

    private final NeisProperties neisProperties;
    private final NeisApiClient neisApiClient;
    private final NeisSchoolMappingService neisSchoolMappingService;
    private final UserRepository userRepository;

    public MealDayResponseDTO getTodayMeals(String username) {
        User student = getStudent(username);
        School school = student.getSchool();
        LocalDate today = LocalDate.now();
        String schoolName = school.getSchoolName();

        if (neisProperties.isDevMode()) {
            return sampleMeals(today, schoolName);
        }

        NeisSchoolCodeDTO neisCodes;
        try {
            neisCodes = neisSchoolMappingService.resolveNeisCodes(school);
        } catch (NeisMappingException exception) {
            return MealDayResponseDTO.mappingFailed(today, schoolName, MAPPING_FAILED_MESSAGE);
        }

        List<MealItemResponseDTO> meals;
        try {
            meals = neisApiClient.fetchMeals(
                    neisCodes.getOfficeCode(),
                    neisCodes.getSchoolCode(),
                    today
            );
        } catch (BusinessException exception) {
            return MealDayResponseDTO.unavailable(today, schoolName, UNAVAILABLE_MESSAGE);
        }

        if (meals.isEmpty()) {
            return MealDayResponseDTO.noMeals(today, schoolName, NO_MEALS_MESSAGE);
        }

        return MealDayResponseDTO.ok(today, schoolName, meals, null);
    }

    private MealDayResponseDTO sampleMeals(LocalDate date, String schoolName) {
        List<MealItemResponseDTO> meals = List.of(
                new MealItemResponseDTO("중식", 2,
                        "· 현미밥\n· 미역국\n· 제육볶음\n· 브로콜리 무침\n· 깍두기",
                        "650.0 Kcal"),
                new MealItemResponseDTO("석식", 3,
                        "· 잡곡밥\n· 된장찌개\n· 순살치킨\n· 요구르트",
                        "580.0 Kcal")
        );
        return MealDayResponseDTO.ok(date, schoolName, meals, "개발 모드 샘플 급식입니다.");
    }

    private User getStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("학생만 급식 정보를 조회할 수 있습니다.");
        }
        return user;
    }
}
