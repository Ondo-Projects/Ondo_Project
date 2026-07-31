package com.ondo.domain.home.service;

import com.ondo.domain.counseling.dto.CounselingResponseDTO;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.service.CounselingService;
import com.ondo.domain.home.dto.CommonHomeAggregateResponseDTO;
import com.ondo.domain.home.dto.HomeSectionResult;
import com.ondo.domain.home.support.HomeAggregateSupport;
import com.ondo.domain.meal.service.MealService;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO;
import com.ondo.domain.precounseling.service.PreCounselingProfileService;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.profile.service.ProfileSchoolService;
import com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO;
import com.ondo.domain.schoollife.dto.TimetableDayResponseDTO;
import com.ondo.domain.schoollife.service.SchoolScheduleService;
import com.ondo.domain.schoollife.service.TimetableService;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import com.ondo.domain.weather.service.WeatherService;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonHomeAggregateService {

    private final UserRepository userRepository;
    private final ProfileSchoolService profileSchoolService;
    private final WeatherService weatherService;
    private final SchoolScheduleService schoolScheduleService;
    private final MealService mealService;
    private final TimetableService timetableService;
    private final CounselingService counselingService;
    private final PreCounselingProfileService preCounselingProfileService;

    public CommonHomeAggregateResponseDTO loadHome(String username, int days) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        Role role = user.getRole();

        if (role != Role.STUDENT && role != Role.TEACHER) {
            throw new BusinessException("학교 홈을 불러올 권한이 없습니다.");
        }

        HomeSectionResult<ProfileSchoolResponseDTO> schoolResult = HomeAggregateSupport.loadSafely(
                () -> profileSchoolService.getMySchool(username, role),
                "학교 정보를 불러오지 못했습니다."
        );
        HomeSectionResult<WeatherTodayResponseDTO> weatherResult = HomeAggregateSupport.loadSafely(
                () -> weatherService.getTodayWeatherForHome(username),
                "날씨 정보를 불러올 수 없습니다."
        );
        HomeSectionResult<SchoolScheduleUpcomingResponseDTO> scheduleResult = HomeAggregateSupport.loadSafely(
                () -> schoolScheduleService.getUpcomingScheduleForHome(username, days),
                "학사일정을 불러올 수 없습니다."
        );

        HomeSectionResult<com.ondo.domain.meal.dto.MealDayResponseDTO> mealsResult =
                role == Role.STUDENT
                        ? HomeAggregateSupport.loadSafely(
                                () -> mealService.getTodayMeals(username),
                                "급식 정보를 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        HomeSectionResult<TimetableDayResponseDTO> timetableResult =
                role == Role.STUDENT
                        ? HomeAggregateSupport.loadSafely(
                                () -> timetableService.getTodayTimetable(username),
                                "시간표를 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        HomeSectionResult<Long> unreadResult =
                role == Role.TEACHER
                        ? HomeAggregateSupport.loadSafely(
                                () -> counselingService.getTeacherUnreadCount(username),
                                "교사 요약 정보를 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        HomeSectionResult<List<CounselingResponseDTO>> teacherPostsResult =
                role == Role.TEACHER
                        ? HomeAggregateSupport.loadSafely(
                                () -> counselingService.getTeacherPosts(username, null),
                                "교사 요약 정보를 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        HomeSectionResult<List<PreCounselingProfileSummaryDTO>> preCounselResult =
                role == Role.TEACHER
                        ? HomeAggregateSupport.loadSafely(
                                () -> preCounselingProfileService.getAssignedStudentSummaries(username),
                                "교사 요약 정보를 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        String teacherSummaryError = firstError(unreadResult, teacherPostsResult, preCounselResult);
        Long waitingCount = null;
        Long preCounselPendingCount = null;
        if (teacherPostsResult.getValue() != null) {
            waitingCount = teacherPostsResult.getValue().stream()
                    .filter(post -> post.getStatus() == CounselingStatus.WAITING)
                    .count();
        }
        if (preCounselResult.getValue() != null) {
            preCounselPendingCount = preCounselResult.getValue().stream()
                    .filter(summary -> !summary.isCompleted())
                    .count();
        }

        return CommonHomeAggregateResponseDTO.builder()
                .schoolProfile(schoolResult.getValue())
                .schoolProfileError(schoolResult.getError())
                .weather(weatherResult.getValue())
                .weatherError(weatherResult.getError())
                .schedule(scheduleResult.getValue())
                .scheduleError(scheduleResult.getError())
                .meals(mealsResult.getValue())
                .mealsError(mealsResult.getError())
                .timetable(timetableResult.getValue())
                .timetableError(timetableResult.getError())
                .teacherUnreadCount(unreadResult.getValue())
                .teacherWaitingCount(waitingCount)
                .teacherPreCounselPendingCount(preCounselPendingCount)
                .teacherSummaryError(teacherSummaryError)
                .teacherCounselingPosts(teacherPostsResult.getValue())
                .teacherPreCounselSummaries(preCounselResult.getValue())
                .build();
    }

    private static String firstError(HomeSectionResult<?>... results) {
        for (HomeSectionResult<?> result : results) {
            if (result.getError() != null) {
                return result.getError();
            }
        }
        return null;
    }
}
