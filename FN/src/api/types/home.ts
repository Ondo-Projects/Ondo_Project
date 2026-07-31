export interface WeatherTodayResponse {
  region?: string | null;
  condition?: string | null;
  icon?: string | null;
  temperature?: string | null;
  minTemperature?: string | null;
  maxTemperature?: string | null;
  message?: string | null;
}

export interface SchoolScheduleItem {
  date: string;
  eventName: string;
  eventContent?: string | null;
}

export type SchoolScheduleStatus = 'OK' | 'NO_EVENTS' | 'MAPPING_FAILED' | 'UNAVAILABLE';

export interface SchoolScheduleUpcomingResponse {
  schoolName?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status?: SchoolScheduleStatus | null;
  events?: SchoolScheduleItem[] | null;
  message?: string | null;
}

export interface ProfileSchoolResponse {
  schoolCode?: string | null;
  schoolName?: string | null;
  region?: string | null;
  schoolType?: string | null;
  message?: string | null;
}

export interface MealItem {
  mealType: string;
  mealOrder: number;
  menu: string;
  calories?: string | null;
}

export type MealDayStatus = 'OK' | 'NO_MEALS' | 'MAPPING_FAILED' | 'UNAVAILABLE';

export interface MealDayResponse {
  date?: string | null;
  schoolName?: string | null;
  status?: MealDayStatus | null;
  meals?: MealItem[] | null;
  message?: string | null;
}

export interface TimetablePeriod {
  period: number;
  subject: string;
  classroom?: string | null;
}

export type TimetableStatus =
  | 'OK'
  | 'NO_CLASSES'
  | 'PROFILE_INCOMPLETE'
  | 'MAPPING_FAILED'
  | 'UNAVAILABLE';

export interface TimetableDayResponse {
  date?: string | null;
  schoolName?: string | null;
  grade?: number | null;
  classNumber?: number | null;
  status?: TimetableStatus | null;
  periods?: TimetablePeriod[] | null;
  message?: string | null;
}

export interface CounselingPostSummary {
  id: number;
  status: string;
}

export interface PreCounselingProfileSummary {
  studentUsername: string;
  studentName: string;
  completed: boolean;
  updatedAt?: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface StudentHomeAggregateResponse {
  schoolProfile?: ProfileSchoolResponse | null;
  schoolProfileError?: string | null;
  assignment?: import('./student').StudentAssignment | null;
  meals?: MealDayResponse | null;
  mealsError?: string | null;
  weather?: WeatherTodayResponse | null;
  weatherError?: string | null;
  schedule?: SchoolScheduleUpcomingResponse | null;
  scheduleError?: string | null;
  timetable?: TimetableDayResponse | null;
  timetableError?: string | null;
  notices?: import('./student').StudentNotice[] | null;
  noticesError?: string | null;
  todayMood?: import('./student').MoodTodayResponse | null;
  todayMoodError?: string | null;
  preCounselProfile?: import('./student').PreCounselingProfile | null;
  preCounselProfileError?: string | null;
  counselingPosts?: import('./counseling').CounselingPost[] | null;
  counselingPostsError?: string | null;
  suggestions?: import('./suggestion').SuggestionPost[] | null;
  suggestionsError?: string | null;
}

export interface TeacherHomeAggregateResponse {
  unreadCount?: number | null;
  unreadCountError?: string | null;
  counselingPosts?: import('./counseling').CounselingPost[] | null;
  counselingPostsError?: string | null;
  preCounselSummaries?: PreCounselingProfileSummary[] | null;
  preCounselSummariesError?: string | null;
  suggestions?: import('./suggestion').SuggestionPost[] | null;
  suggestionsError?: string | null;
}

export interface CommonHomeAggregateResponse {
  schoolProfile?: ProfileSchoolResponse | null;
  schoolProfileError?: string | null;
  weather?: WeatherTodayResponse | null;
  weatherError?: string | null;
  schedule?: SchoolScheduleUpcomingResponse | null;
  scheduleError?: string | null;
  meals?: MealDayResponse | null;
  mealsError?: string | null;
  timetable?: TimetableDayResponse | null;
  timetableError?: string | null;
  teacherUnreadCount?: number | null;
  teacherWaitingCount?: number | null;
  teacherPreCounselPendingCount?: number | null;
  teacherSummaryError?: string | null;
  teacherCounselingPosts?: CounselingPostSummary[] | null;
  teacherPreCounselSummaries?: PreCounselingProfileSummary[] | null;
}
