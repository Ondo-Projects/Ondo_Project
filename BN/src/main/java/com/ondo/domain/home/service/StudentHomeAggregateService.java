package com.ondo.domain.home.service;

import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.assignment.service.AssignmentService;
import com.ondo.domain.counseling.service.CounselingService;
import com.ondo.domain.home.dto.HomeSectionResult;
import com.ondo.domain.home.dto.StudentHomeAggregateResponseDTO;
import com.ondo.domain.home.support.HomeAggregateSupport;
import com.ondo.domain.meal.service.MealService;
import com.ondo.domain.mood.dto.MoodRecordResponseDTO;
import com.ondo.domain.mood.service.MoodService;
import com.ondo.domain.notice.service.NoticeService;
import com.ondo.domain.precounseling.service.PreCounselingProfileService;
import com.ondo.domain.profile.service.ProfileSchoolService;
import com.ondo.domain.schoollife.service.SchoolScheduleService;
import com.ondo.domain.schoollife.service.TimetableService;
import com.ondo.domain.suggestion.service.SuggestionService;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.weather.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentHomeAggregateService {

    private static final int SCHEDULE_DAYS = 14;

    private final ProfileSchoolService profileSchoolService;
    private final AssignmentService assignmentService;
    private final MealService mealService;
    private final WeatherService weatherService;
    private final SchoolScheduleService schoolScheduleService;
    private final TimetableService timetableService;
    private final NoticeService noticeService;
    private final MoodService moodService;
    private final PreCounselingProfileService preCounselingProfileService;
    private final CounselingService counselingService;
    private final SuggestionService suggestionService;

    public StudentHomeAggregateResponseDTO loadHome(String username) {
        HomeSectionResult<com.ondo.domain.profile.dto.ProfileSchoolResponseDTO> schoolResult =
                HomeAggregateSupport.loadSafely(
                        () -> profileSchoolService.getMySchool(username, Role.STUDENT),
                        "학교 정보를 불러오지 못했습니다."
                );
        AssignmentResponseDTO assignment = assignmentService.findMyAssignmentOptional(username).orElse(null);
        HomeSectionResult<com.ondo.domain.meal.dto.MealDayResponseDTO> mealsResult =
                HomeAggregateSupport.loadSafely(
                        () -> mealService.getTodayMeals(username),
                        "급식 정보를 불러올 수 없습니다."
                );
        HomeSectionResult<com.ondo.domain.weather.dto.WeatherTodayResponseDTO> weatherResult =
                HomeAggregateSupport.loadSafely(
                        () -> weatherService.getTodayWeather(username),
                        "날씨 정보를 불러올 수 없습니다."
                );
        HomeSectionResult<com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO> scheduleResult =
                HomeAggregateSupport.loadSafely(
                        () -> schoolScheduleService.getUpcomingScheduleForHome(username, SCHEDULE_DAYS),
                        "학사일정을 불러올 수 없습니다."
                );
        HomeSectionResult<com.ondo.domain.schoollife.dto.TimetableDayResponseDTO> timetableResult =
                HomeAggregateSupport.loadSafely(
                        () -> timetableService.getTodayTimetable(username),
                        "시간표를 불러올 수 없습니다."
                );
        HomeSectionResult<MoodRecordResponseDTO> moodResult = HomeAggregateSupport.loadSafely(
                () -> moodService.findTodayMood(username).orElse(null),
                "마음 날씨를 불러오지 못했습니다."
        );
        HomeSectionResult<com.ondo.domain.precounseling.dto.PreCounselingProfileResponseDTO> preCounselResult =
                HomeAggregateSupport.loadSafely(
                        () -> preCounselingProfileService.getMyProfile(username),
                        "사전 상담 카드를 불러오지 못했습니다."
                );
        HomeSectionResult<java.util.List<com.ondo.domain.counseling.dto.CounselingResponseDTO>> counselResult =
                HomeAggregateSupport.loadSafely(
                        () -> counselingService.getMyPosts(username),
                        "상담 목록을 불러오지 못했습니다."
                );
        HomeSectionResult<java.util.List<com.ondo.domain.suggestion.dto.SuggestionResponseDTO>> suggestionsResult =
                HomeAggregateSupport.loadSafely(
                        () -> suggestionService.getMyPosts(username, Role.STUDENT),
                        "건의 목록을 불러오지 못했습니다."
                );
        HomeSectionResult<java.util.List<com.ondo.domain.notice.dto.NoticeResponseDTO>> noticesResult =
                assignment != null
                        ? HomeAggregateSupport.loadSafely(
                                () -> noticeService.getStudentNotices(username),
                                "알림을 불러올 수 없습니다."
                        )
                        : HomeSectionResult.ok(null);

        return StudentHomeAggregateResponseDTO.builder()
                .schoolProfile(schoolResult.getValue())
                .schoolProfileError(schoolResult.getError())
                .assignment(assignment)
                .meals(mealsResult.getValue())
                .mealsError(mealsResult.getError())
                .weather(weatherResult.getValue())
                .weatherError(weatherResult.getError())
                .schedule(scheduleResult.getValue())
                .scheduleError(scheduleResult.getError())
                .timetable(timetableResult.getValue())
                .timetableError(timetableResult.getError())
                .notices(noticesResult.getValue())
                .noticesError(noticesResult.getError())
                .todayMood(StudentHomeAggregateResponseDTO.moodPayload(moodResult.getValue()))
                .todayMoodError(moodResult.getError())
                .preCounselProfile(preCounselResult.getValue())
                .preCounselProfileError(preCounselResult.getError())
                .counselingPosts(counselResult.getValue())
                .counselingPostsError(counselResult.getError())
                .suggestions(suggestionsResult.getValue())
                .suggestionsError(suggestionsResult.getError())
                .build();
    }
}
