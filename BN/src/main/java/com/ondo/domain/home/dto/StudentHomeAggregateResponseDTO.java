package com.ondo.domain.home.dto;

import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.counseling.dto.CounselingResponseDTO;
import com.ondo.domain.meal.dto.MealDayResponseDTO;
import com.ondo.domain.mood.dto.MoodRecordResponseDTO;
import com.ondo.domain.notice.dto.NoticeResponseDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileResponseDTO;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO;
import com.ondo.domain.schoollife.dto.TimetableDayResponseDTO;
import com.ondo.domain.suggestion.dto.SuggestionResponseDTO;
import com.ondo.domain.weather.dto.WeatherTodayResponseDTO;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class StudentHomeAggregateResponseDTO {

    private final ProfileSchoolResponseDTO schoolProfile;
    private final String schoolProfileError;
    private final AssignmentResponseDTO assignment;
    private final MealDayResponseDTO meals;
    private final String mealsError;
    private final WeatherTodayResponseDTO weather;
    private final String weatherError;
    private final SchoolScheduleUpcomingResponseDTO schedule;
    private final String scheduleError;
    private final TimetableDayResponseDTO timetable;
    private final String timetableError;
    private final List<NoticeResponseDTO> notices;
    private final String noticesError;
    private final Object todayMood;
    private final String todayMoodError;
    private final PreCounselingProfileResponseDTO preCounselProfile;
    private final String preCounselProfileError;
    private final List<CounselingResponseDTO> counselingPosts;
    private final String counselingPostsError;
    private final List<SuggestionResponseDTO> suggestions;
    private final String suggestionsError;

    public static Object moodPayload(MoodRecordResponseDTO mood) {
        if (mood == null) {
            return Map.of("recorded", false);
        }
        return mood;
    }
}
