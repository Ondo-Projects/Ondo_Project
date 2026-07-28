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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MealService {

    private final NeisProperties neisProperties;
    private final NeisApiClient neisApiClient;
    private final NeisSchoolMappingService neisSchoolMappingService;
    private final UserRepository userRepository;

    public MealDayResponseDTO getTodayMeals(String username) {
        User student = getStudent(username);
        School school = student.getSchool();
        LocalDate today = LocalDate.now();

        if (neisProperties.isDevMode()) {
            return sampleMeals(today, school.getSchoolName());
        }

        NeisSchoolCodeDTO neisCodes = neisSchoolMappingService.resolveNeisCodes(school);
        List<MealItemResponseDTO> meals = neisApiClient.fetchMeals(
                neisCodes.getOfficeCode(),
                neisCodes.getSchoolCode(),
                today
        );

        if (meals.isEmpty()) {
            return MealDayResponseDTO.empty(today, school.getSchoolName(), "오늘 등록된 급식 정보가 없습니다.");
        }

        return new MealDayResponseDTO(today, school.getSchoolName(), meals, null);
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
        return new MealDayResponseDTO(date, schoolName, meals, "개발 모드 샘플 급식입니다.");
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
