package com.ondo.domain.admin.service;

import com.ondo.domain.admin.dto.AdminActivityLogDTO;
import com.ondo.domain.admin.dto.AdminCounselingAccessLogDTO;
import com.ondo.domain.admin.dto.AdminDashboardResponseDTO;
import com.ondo.domain.admin.dto.AdminPageResponseDTO;
import com.ondo.domain.admin.dto.AdminPreCounselAccessLogDTO;
import com.ondo.domain.admin.dto.AdminSchoolSummaryDTO;
import com.ondo.domain.admin.dto.AdminNeisSyncResponseDTO;
import com.ondo.domain.admin.dto.AdminSchoolSyncResponseDTO;
import com.ondo.domain.admin.dto.AdminStatisticsResponseDTO;
import com.ondo.domain.admin.dto.AdminSystemStatusResponseDTO;
import com.ondo.domain.admin.dto.AdminUserSummaryDTO;
import com.ondo.domain.admin.entity.AdminActivityLog;
import com.ondo.domain.admin.repository.AdminActivityLogRepository;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingAccessLogRepository;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.mood.entity.MoodLevel;
import com.ondo.domain.mood.repository.MoodRecordRepository;
import com.ondo.domain.precounseling.repository.PreCounselingProfileAccessLogRepository;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.school.service.SchoolCsvImportService;
import com.ondo.domain.meal.service.NeisSchoolMappingService;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.config.EncryptionProperties;
import com.ondo.global.config.NeisProperties;
import com.ondo.global.config.WeatherProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_NEIS_SYNC_LIMIT = 50;
    private static final int MAX_NEIS_SYNC_LIMIT = 100;

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final CounselingPostRepository counselingPostRepository;
    private final CounselingAccessLogRepository counselingAccessLogRepository;
    private final PreCounselingProfileAccessLogRepository preCounselingProfileAccessLogRepository;
    private final MoodRecordRepository moodRecordRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final SchoolCsvImportService schoolCsvImportService;
    private final NeisSchoolMappingService neisSchoolMappingService;
    private final AdminActivityLogRepository adminActivityLogRepository;
    private final NeisProperties neisProperties;
    private final WeatherProperties weatherProperties;
    private final EncryptionProperties encryptionProperties;

    public AdminDashboardResponseDTO getDashboard() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        return new AdminDashboardResponseDTO(
                userRepository.count(),
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.TEACHER),
                userRepository.countByRole(Role.ADMIN),
                schoolRepository.count(),
                schoolRepository.countNeisMapped(),
                counselingPostRepository.countByDeletedAtIsNull(),
                counselingPostRepository.countByCreatedAtAfterAndDeletedAtIsNull(startOfToday),
                counselingAccessLogRepository.countByAccessedAtAfter(startOfToday),
                preCounselingProfileAccessLogRepository.countByAccessedAtAfter(startOfToday)
        );
    }

    public AdminSystemStatusResponseDTO getSystemStatus() {
        return new AdminSystemStatusResponseDTO(
                neisProperties.isDevMode(),
                isConfigured(neisProperties.getApiKey()),
                weatherProperties.isDevMode(),
                isConfigured(weatherProperties.getApiKey()),
                encryptionProperties.isDevMode(),
                isConfigured(encryptionProperties.getKey())
        );
    }

    public AdminStatisticsResponseDTO getStatistics() {
        Map<String, Long> counselingByStatus = new LinkedHashMap<>();
        for (CounselingStatus status : CounselingStatus.values()) {
            counselingByStatus.put(status.name(), 0L);
        }
        for (Object[] row : counselingPostRepository.countGroupByStatus()) {
            counselingByStatus.put(((CounselingStatus) row[0]).name(), (Long) row[1]);
        }

        Map<String, Long> moodByLevel = new LinkedHashMap<>();
        for (MoodLevel level : MoodLevel.values()) {
            moodByLevel.put(level.name(), 0L);
        }
        LocalDate since = LocalDate.now().minusDays(6);
        for (Object[] row : moodRecordRepository.countGroupByMoodLevelSince(since)) {
            moodByLevel.put(((MoodLevel) row[0]).name(), (Long) row[1]);
        }

        return new AdminStatisticsResponseDTO(counselingByStatus, moodByLevel);
    }

    public AdminPageResponseDTO<AdminUserSummaryDTO> searchUsers(String roleParam, String keyword, String schoolCode, int page, int size) {
        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Role role = parseRole(roleParam);
        Page<AdminUserSummaryDTO> result = userRepository.searchForAdmin(
                role,
                normalizeKeyword(keyword),
                normalizeKeyword(schoolCode),
                pageable
        ).map(AdminUserSummaryDTO::from);

        return toPageResponse(result);
    }

    @Transactional
    public AdminUserSummaryDTO updateUserStatus(String adminUsername, String targetUsername, boolean active) {
        if (adminUsername.equals(targetUsername)) {
            throw new BusinessException("본인 계정 상태는 변경할 수 없습니다.");
        }

        User user = getManagedUser(targetUsername);
        if (user.getRole() == Role.ADMIN && !active) {
            long activeAdminCount = userRepository.countByRoleAndActive(Role.ADMIN, true);
            if (activeAdminCount <= 1 && user.isActive()) {
                throw new BusinessException("마지막 활성 관리자 계정은 비활성화할 수 없습니다.");
            }
        }

        user.updateActive(active);
        saveActivity(adminUsername, active ? "USER_ACTIVATE" : "USER_DEACTIVATE", targetUsername,
                active ? "계정 활성화" : "계정 비활성화");
        return AdminUserSummaryDTO.from(user);
    }

    @Transactional
    public AdminUserSummaryDTO changeUserSchool(String adminUsername, String targetUsername, String schoolCode) {
        User user = getManagedUser(targetUsername);
        School newSchool = schoolRepository.findById(schoolCode.trim())
                .orElseThrow(() -> new BusinessException("선택한 학교를 찾을 수 없습니다."));

        if (user.getSchool().getSchoolCode().equals(newSchool.getSchoolCode())) {
            throw new BusinessException("이미 등록된 학교입니다.");
        }

        if (user.getRole() == Role.STUDENT) {
            assignmentRepository.findByStudent(user).ifPresent(assignmentRepository::delete);
        } else if (user.getRole() == Role.TEACHER) {
            List<StudentTeacherAssignment> assignments = assignmentRepository.findByTeacher(user);
            if (!assignments.isEmpty()) {
                assignmentRepository.deleteAll(assignments);
            }
        }

        user.changeSchool(newSchool);
        saveActivity(adminUsername, "USER_SCHOOL_CHANGE", targetUsername,
                newSchool.getSchoolName() + " (" + newSchool.getSchoolCode() + ")");
        return AdminUserSummaryDTO.from(user);
    }

    @Transactional
    public AdminSchoolSyncResponseDTO syncSchoolsFromCsv(String adminUsername) {
        int syncedCount = schoolCsvImportService.syncFromCsv();
        saveActivity(adminUsername, "SCHOOL_CSV_SYNC", null, syncedCount + "건 동기화");
        return new AdminSchoolSyncResponseDTO(
                syncedCount,
                "학교 CSV 동기화가 완료되었습니다. (" + syncedCount + "건)"
        );
    }

    @Transactional
    public AdminNeisSyncResponseDTO syncNeisSchoolCodes(String adminUsername, int limit) {
        if (neisProperties.isDevMode()) {
            throw new BusinessException("NEIS dev-mode가 활성화되어 있어 일괄 매핑을 실행할 수 없습니다.");
        }
        if (!isConfigured(neisProperties.getApiKey())) {
            throw new BusinessException("NEIS API 키가 설정되지 않았습니다.");
        }

        int syncLimit = normalizeNeisSyncLimit(limit);
        List<School> targets = schoolRepository.findUnmappedSchools(PageRequest.of(0, syncLimit));

        int successCount = 0;
        int failedCount = 0;

        for (School school : targets) {
            try {
                neisSchoolMappingService.resolveNeisCodes(school);
                successCount++;
            } catch (BusinessException exception) {
                failedCount++;
            }
        }

        String detail = "처리 " + targets.size() + "건 / 성공 " + successCount + "건 / 실패 " + failedCount + "건";
        saveActivity(adminUsername, "SCHOOL_NEIS_SYNC", null, detail);

        return new AdminNeisSyncResponseDTO(
                targets.size(),
                successCount,
                failedCount,
                "NEIS 학교 코드 일괄 매핑이 완료되었습니다. (" + detail + ")"
        );
    }

    public AdminPageResponseDTO<AdminSchoolSummaryDTO> searchSchools(String keyword, Boolean mapped, int page, int size) {
        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Page<AdminSchoolSummaryDTO> result = schoolRepository.searchForAdmin(
                normalizeKeyword(keyword),
                mapped,
                pageable
        ).map(AdminSchoolSummaryDTO::from);

        return toPageResponse(result);
    }

    public AdminPageResponseDTO<AdminCounselingAccessLogDTO> getCounselingAccessLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Page<AdminCounselingAccessLogDTO> result = counselingAccessLogRepository
                .findAllByOrderByAccessedAtDesc(pageable)
                .map(AdminCounselingAccessLogDTO::from);

        return toPageResponse(result);
    }

    public AdminPageResponseDTO<AdminPreCounselAccessLogDTO> getPreCounselAccessLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Page<AdminPreCounselAccessLogDTO> result = preCounselingProfileAccessLogRepository
                .findAllByOrderByAccessedAtDesc(pageable)
                .map(AdminPreCounselAccessLogDTO::from);

        return toPageResponse(result);
    }

    public AdminPageResponseDTO<AdminActivityLogDTO> getActivityLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Page<AdminActivityLogDTO> result = adminActivityLogRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(AdminActivityLogDTO::from);

        return toPageResponse(result);
    }

    private User getManagedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private void saveActivity(String adminUsername, String action, String targetUsername, String detail) {
        adminActivityLogRepository.save(AdminActivityLog.builder()
                .adminUsername(adminUsername)
                .action(action)
                .targetUsername(targetUsername)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private boolean isConfigured(String value) {
        return StringUtils.hasText(value);
    }

    private Role parseRole(String roleParam) {
        if (roleParam == null || roleParam.isBlank()) {
            return null;
        }
        return Role.valueOf(roleParam.trim().toUpperCase());
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private int normalizeNeisSyncLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_NEIS_SYNC_LIMIT;
        }
        return Math.min(limit, MAX_NEIS_SYNC_LIMIT);
    }

    private <T> AdminPageResponseDTO<T> toPageResponse(Page<T> page) {
        return new AdminPageResponseDTO<>(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize()
        );
    }
}
