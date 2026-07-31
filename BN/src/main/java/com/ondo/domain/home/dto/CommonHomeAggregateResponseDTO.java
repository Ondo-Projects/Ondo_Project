package com.ondo.domain.home.dto;

import com.ondo.domain.meal.dto.MealDayResponseDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO;
import com.ondo.domain.schoollife.dto.TimetableDayResponseDTO;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CommonHomeAggregateResponseDTO {

    private final ProfileSchoolResponseDTO schoolProfile;
    private final String schoolProfileError;
    private final WeatherTodayResponseDTO weather;
    private final String weatherError;
    private final SchoolScheduleUpcomingResponseDTO schedule;
    private final String scheduleError;
    private final MealDayResponseDTO meals;
    private final String mealsError;
    private final TimetableDayResponseDTO timetable;
    private final String timetableError;
    private final Long teacherUnreadCount;
    private final Long teacherWaitingCount;
    private final Long teacherPreCounselPendingCount;
    private final String teacherSummaryError;
    private final List<com.ondo.domain.counseling.dto.CounselingResponseDTO> teacherCounselingPosts;
    private final List<PreCounselingProfileSummaryDTO> teacherPreCounselSummaries;
}
