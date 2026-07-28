package com.ondo.domain.mood.service;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.mood.dto.MoodCountDto;
import com.ondo.domain.mood.dto.MoodRecordRequestDTO;
import com.ondo.domain.mood.dto.MoodRecordResponseDTO;
import com.ondo.domain.mood.dto.StudentMoodSummaryResponseDTO;
import com.ondo.domain.mood.dto.StudentWeeklyMoodResponseDTO;
import com.ondo.domain.mood.dto.TeacherWeeklyMoodResponseDTO;
import com.ondo.domain.mood.dto.DailyMoodRecordDto;
import com.ondo.domain.mood.entity.MoodLevel;
import com.ondo.domain.mood.entity.MoodRecord;
import com.ondo.domain.mood.repository.MoodRecordRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MoodService {

    private final MoodRecordRepository moodRecordRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public MoodRecordResponseDTO saveTodayMood(String username, MoodRecordRequestDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        MoodRecord record = moodRecordRepository.findByStudentAndRecordedDate(student, today)
                .orElseGet(() -> MoodRecord.builder()
                        .student(student)
                        .moodLevel(request.getMoodLevel())
                        .recordedDate(today)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());

        if (record.getId() != null) {
            record.update(request.getMoodLevel());
        }

        return new MoodRecordResponseDTO(moodRecordRepository.save(record));
    }

    public Optional<MoodRecordResponseDTO> findTodayMood(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        return moodRecordRepository.findByStudentAndRecordedDate(student, LocalDate.now())
                .map(MoodRecordResponseDTO::new);
    }

    public MoodRecordResponseDTO getTodayMood(String username) {
        return findTodayMood(username)
                .orElseThrow(() -> new BusinessException("오늘 기록한 마음 날씨가 없습니다."));
    }

    public List<StudentMoodSummaryResponseDTO> getAssignedStudentsTodayMood(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();

        if (students.isEmpty()) {
            return List.of();
        }

        LocalDate today = LocalDate.now();
        Map<String, MoodRecord> moodByStudent = moodRecordRepository
                .findByStudentInAndRecordedDateOrderByStudentUsernameAsc(students, today)
                .stream()
                .collect(Collectors.toMap(record -> record.getStudent().getUsername(), Function.identity()));

        List<StudentMoodSummaryResponseDTO> summaries = new ArrayList<>();
        for (User student : students) {
            MoodRecord record = moodByStudent.get(student.getUsername());
            if (record != null) {
                summaries.add(StudentMoodSummaryResponseDTO.from(student, record));
            } else {
                summaries.add(StudentMoodSummaryResponseDTO.withoutRecord(student, today));
            }
        }
        return summaries;
    }

    public TeacherWeeklyMoodResponseDTO getAssignedStudentsWeeklyMood(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);

        if (students.isEmpty()) {
            return new TeacherWeeklyMoodResponseDTO(
                    startDate,
                    endDate,
                    0,
                    buildEmptyMoodCounts(),
                    List.of()
            );
        }

        List<MoodRecord> records = moodRecordRepository
                .findByStudentInAndRecordedDateBetweenOrderByStudentUsernameAscRecordedDateAsc(
                        students,
                        startDate,
                        endDate
                );

        Map<String, Map<LocalDate, MoodRecord>> recordsByStudent = records.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getStudent().getUsername(),
                        Collectors.toMap(MoodRecord::getRecordedDate, Function.identity(), (left, right) -> right)
                ));

        EnumMap<MoodLevel, Long> moodCountMap = new EnumMap<>(MoodLevel.class);
        for (MoodLevel level : MoodLevel.values()) {
            moodCountMap.put(level, 0L);
        }
        for (MoodRecord record : records) {
            moodCountMap.merge(record.getMoodLevel(), 1L, Long::sum);
        }

        List<MoodCountDto> moodCounts = List.of(
                MoodLevel.SUNNY,
                MoodLevel.FAIR,
                MoodLevel.CLOUDY,
                MoodLevel.RAINY,
                MoodLevel.STORMY
        ).stream()
                .map(level -> new MoodCountDto(level, moodCountMap.getOrDefault(level, 0L)))
                .toList();

        List<StudentWeeklyMoodResponseDTO> studentSummaries = new ArrayList<>();
        for (User student : students) {
            Map<LocalDate, MoodRecord> studentRecords = recordsByStudent.getOrDefault(
                    student.getUsername(),
                    Map.of()
            );

            List<DailyMoodRecordDto> dailyRecords = new ArrayList<>();
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                MoodRecord record = studentRecords.get(date);
                dailyRecords.add(new DailyMoodRecordDto(
                        date,
                        record != null ? record.getMoodLevel() : null
                ));
            }

            studentSummaries.add(new StudentWeeklyMoodResponseDTO(
                    student.getUsername(),
                    student.getName(),
                    studentRecords.size(),
                    dailyRecords
            ));
        }

        return new TeacherWeeklyMoodResponseDTO(
                startDate,
                endDate,
                records.size(),
                moodCounts,
                studentSummaries
        );
    }

    private List<MoodCountDto> buildEmptyMoodCounts() {
        return List.of(
                MoodLevel.SUNNY,
                MoodLevel.FAIR,
                MoodLevel.CLOUDY,
                MoodLevel.RAINY,
                MoodLevel.STORMY
        ).stream()
                .map(level -> new MoodCountDto(level, 0L))
                .toList();
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private void assertRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
    }
}
