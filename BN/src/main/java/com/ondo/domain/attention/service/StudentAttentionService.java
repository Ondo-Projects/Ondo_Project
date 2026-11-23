package com.ondo.domain.attention.service;

import com.ondo.domain.attention.dto.AttentionReasonCode;
import com.ondo.domain.attention.dto.AttentionReasonDTO;
import com.ondo.domain.attention.dto.StudentAttentionResponseDTO;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 담임이 먼저 살펴보면 좋을 학생을 골라 줍니다 (위기 신호 알림).
 * 담임이 이미 볼 수 있는 기분 기록과 상담 신청만 사용하며, 새로운 정보를 모으지 않습니다.
 * 진단이 아니라 "확인해 보세요" 수준의 안내입니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentAttentionService {

    /** 최근 며칠을 볼지 (오늘 포함) */
    static final int WINDOW_DAYS = 7;
    /** 이 기간에 '우울'·'힘듦'이 몇 번 이상이면 알릴지 */
    static final int LOW_MOOD_THRESHOLD = 3;

    private static final Set<MoodLevel> LOW_MOODS = EnumSet.of(MoodLevel.RAINY, MoodLevel.STORMY);
    private static final Set<CounselingStatus> OPEN_STATUSES = EnumSet.of(CounselingStatus.WAITING, CounselingStatus.CONFIRMED);

    private final UserRepository userRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final MoodRecordRepository moodRecordRepository;
    private final CounselingPostRepository counselingPostRepository;

    public List<StudentAttentionResponseDTO> getForTeacher(String teacherUsername, LocalDate today) {
        User teacher = userRepository.findByUsername(teacherUsername)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (teacher.getRole() != Role.TEACHER) {
            throw new BusinessException("접근 권한이 없습니다.");
        }

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();
        if (students.isEmpty()) {
            return List.of();
        }

        Map<String, List<MoodRecord>> moodsByStudent = moodRecordRepository
                .findByStudentInAndRecordedDateBetweenOrderByStudentUsernameAscRecordedDateAsc(
                        students, today.minusDays(WINDOW_DAYS - 1L), today)
                .stream()
                .collect(Collectors.groupingBy(record -> record.getStudent().getUsername()));

        Map<String, List<CounselingPost>> openViolenceByStudent = counselingPostRepository
                .findByStudentInAndDeletedAtIsNullOrderByCreatedAtDesc(students)
                .stream()
                .filter(post -> post.getCounselingType() == CounselingType.SCHOOL_VIOLENCE)
                .filter(post -> OPEN_STATUSES.contains(post.getStatus()))
                .filter(post -> post.isAssignedTo(teacher))
                .collect(Collectors.groupingBy(post -> post.getStudent().getUsername()));

        List<StudentAttentionResponseDTO> result = new ArrayList<>();
        for (User student : students) {
            List<AttentionReasonDTO> reasons = new ArrayList<>();
            boolean urgent = false;

            for (CounselingPost post : openViolenceByStudent.getOrDefault(student.getUsername(), List.of())) {
                reasons.add(new AttentionReasonDTO(
                        AttentionReasonCode.SCHOOL_VIOLENCE_OPEN,
                        "아직 끝나지 않은 학교폭력 상담이 있어요.",
                        post.getId()));
                urgent = true;
            }

            List<MoodRecord> moods = moodsByStudent.getOrDefault(student.getUsername(), List.of());
            boolean stormyToday = moods.stream()
                    .anyMatch(record -> record.getRecordedDate().equals(today) && record.getMoodLevel() == MoodLevel.STORMY);
            if (stormyToday) {
                reasons.add(new AttentionReasonDTO(
                        AttentionReasonCode.STORMY_TODAY,
                        "오늘 마음 날씨를 '힘듦'으로 남겼어요.",
                        null));
                urgent = true;
            }

            long lowDays = moods.stream().filter(record -> LOW_MOODS.contains(record.getMoodLevel())).count();
            if (lowDays >= LOW_MOOD_THRESHOLD) {
                reasons.add(new AttentionReasonDTO(
                        AttentionReasonCode.LOW_MOOD_REPEATED,
                        "최근 " + WINDOW_DAYS + "일 중 " + lowDays + "일을 '우울'이나 '힘듦'으로 남겼어요.",
                        null));
            }

            if (!reasons.isEmpty()) {
                result.add(new StudentAttentionResponseDTO(student.getUsername(), student.getName(), urgent, reasons));
            }
        }

        result.sort(Comparator
                .comparing(StudentAttentionResponseDTO::isUrgent).reversed()
                .thenComparing(item -> item.getReasons().size(), Comparator.reverseOrder())
                .thenComparing(item -> item.getStudentName() == null ? item.getStudentUsername() : item.getStudentName()));
        return result;
    }
}
