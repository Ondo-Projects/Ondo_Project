package com.ondo.domain.user.retention;

import com.ondo.domain.admin.entity.AdminActivityLog;
import com.ondo.domain.admin.repository.AdminActivityLogRepository;
import com.ondo.domain.admin.service.AdminService;
import com.ondo.domain.assignment.entity.TeacherInviteCode;
import com.ondo.domain.assignment.repository.TeacherInviteCodeRepository;
import com.ondo.domain.counseling.entity.CounselingAccessLog;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingAccessLogRepository;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.mood.entity.MoodLevel;
import com.ondo.domain.mood.entity.MoodRecord;
import com.ondo.domain.mood.repository.MoodRecordRepository;
import com.ondo.domain.notice.entity.TeacherNotice;
import com.ondo.domain.notice.repository.TeacherNoticeRepository;
import com.ondo.domain.precounseling.entity.PreCounselingProfileAccessLog;
import com.ondo.domain.precounseling.entity.StudentPreCounselingProfile;
import com.ondo.domain.precounseling.repository.PreCounselingProfileAccessLogRepository;
import com.ondo.domain.precounseling.repository.StudentPreCounselingProfileRepository;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.suggestion.repository.SuggestionPostRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.entity.UserWithdrawal;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.repository.UserWithdrawalRepository;
import com.ondo.global.error.BusinessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 탈퇴 회원 자동 파기 검증. 모든 변경은 테스트 트랜잭션 안에서 실행되고 끝나면 되돌려집니다.
 * 운영 DB 에서는 절대 실행하지 마세요 (로컬 DB 전용).
 */
@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.jwt.secret=test-secret-key-at-least-32-bytes-long!!",
        "ondo.neis.dev-mode=true",
        "ondo.weather.dev-mode=true",
        "ondo.retention.enabled=false"
})
@Transactional
class DataRetentionIntegrationTest {

    private static final String SCHOOL_CODE = "ITRET001";
    private static final String WITHDRAWN_STUDENT = "it-ret-student-gone";
    private static final String ACTIVE_STUDENT = "it-ret-student-active";
    private static final String RECENT_STUDENT = "it-ret-student-recent";
    private static final String BLOCKED_STUDENT = "it-ret-student-blocked";
    private static final String WITHDRAWN_TEACHER = "it-ret-teacher-gone";
    private static final String ACTIVE_TEACHER = "it-ret-teacher-active";

    @Autowired private DataRetentionService dataRetentionService;
    @Autowired private WithdrawnUserPurger withdrawnUserPurger;
    @Autowired private AdminService adminService;
    @Autowired private SchoolRepository schoolRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserWithdrawalRepository userWithdrawalRepository;
    @Autowired private CounselingPostRepository counselingPostRepository;
    @Autowired private CounselingAccessLogRepository counselingAccessLogRepository;
    @Autowired private StudentPreCounselingProfileRepository preCounselingProfileRepository;
    @Autowired private PreCounselingProfileAccessLogRepository preCounselingAccessLogRepository;
    @Autowired private MoodRecordRepository moodRecordRepository;
    @Autowired private StudentTeacherAssignmentRepository assignmentRepository;
    @Autowired private SuggestionPostRepository suggestionPostRepository;
    @Autowired private TeacherNoticeRepository teacherNoticeRepository;
    @Autowired private TeacherInviteCodeRepository inviteCodeRepository;
    @Autowired private AdminActivityLogRepository adminActivityLogRepository;

    @PersistenceContext
    private EntityManager em;

    private final LocalDateTime now = LocalDateTime.now();
    private School school;

    @BeforeEach
    void setUp() {
        school = schoolRepository.save(School.builder()
                .schoolCode(SCHOOL_CODE)
                .schoolName("파기테스트중학교")
                .region("서울")
                .schoolType("중학교")
                .build());
    }

    @Test
    void findTargets_onlyWithdrawnPastGracePeriod() {
        saveUser(WITHDRAWN_STUDENT, Role.STUDENT, false, now.minusDays(5));
        saveUser(RECENT_STUDENT, Role.STUDENT, false, now.minusDays(1));
        saveUser(ACTIVE_STUDENT, Role.STUDENT, true, null);
        saveUser(BLOCKED_STUDENT, Role.STUDENT, false, null); // 관리자가 비활성화한 계정은 파기 대상이 아님
        em.flush();

        assertThat(dataRetentionService.findWithdrawnTargets(now.minusDays(3)))
                .contains(WITHDRAWN_STUDENT)
                .doesNotContain(RECENT_STUDENT, ACTIVE_STUDENT, BLOCKED_STUDENT);
    }

    @Test
    void purgeStudent_deletesAllPersonalDataAndAccount() {
        User teacher = saveUser(ACTIVE_TEACHER, Role.TEACHER, true, null);
        User student = saveUser(WITHDRAWN_STUDENT, Role.STUDENT, false, now.minusDays(5));
        User other = saveUser(ACTIVE_STUDENT, Role.STUDENT, true, null);

        assignmentRepository.save(StudentTeacherAssignment.builder().teacher(teacher).student(student).assignedAt(now).build());
        CounselingPost post = counselingPostRepository.save(post(student, teacher));
        counselingAccessLogRepository.save(CounselingAccessLog.builder().counselingPost(post).teacher(teacher).accessedAt(now).build());
        preCounselingProfileRepository.save(profile(student));
        preCounselingAccessLogRepository.save(PreCounselingProfileAccessLog.builder().student(student).teacher(teacher).accessedAt(now).build());
        moodRecordRepository.save(MoodRecord.builder().student(student).moodLevel(MoodLevel.SUNNY)
                .recordedDate(LocalDate.now()).createdAt(now).updatedAt(now).build());
        suggestionPostRepository.save(suggestion(student));
        UserWithdrawal withdrawal = userWithdrawalRepository.save(UserWithdrawal.builder()
                .username(WITHDRAWN_STUDENT).role(Role.STUDENT).reason("OTHER").withdrawnAt(now.minusDays(5)).build());
        CounselingPost otherPost = counselingPostRepository.save(post(other, teacher));
        em.flush();

        assertThat(withdrawnUserPurger.purge(WITHDRAWN_STUDENT, now)).isTrue();

        assertThat(userRepository.findById(WITHDRAWN_STUDENT)).isEmpty();
        assertThat(counselingPostRepository.findById(post.getId())).isEmpty();
        assertThat(counselingAccessLogRepository.countByCounselingPostAndTeacher(post, teacher)).isZero();
        assertThat(preCounselingProfileRepository.findById(WITHDRAWN_STUDENT)).isEmpty();
        assertThat(count("SELECT COUNT(l) FROM PreCounselingProfileAccessLog l WHERE l.student.username = :u", WITHDRAWN_STUDENT)).isZero();
        assertThat(count("SELECT COUNT(m) FROM MoodRecord m WHERE m.student.username = :u", WITHDRAWN_STUDENT)).isZero();
        assertThat(count("SELECT COUNT(a) FROM StudentTeacherAssignment a WHERE a.student.username = :u", WITHDRAWN_STUDENT)).isZero();
        assertThat(count("SELECT COUNT(s) FROM SuggestionPost s WHERE s.author.username = :u", WITHDRAWN_STUDENT)).isZero();

        UserWithdrawal anonymized = userWithdrawalRepository.findById(withdrawal.getId()).orElseThrow();
        assertThat(anonymized.getUsername()).isEqualTo("purged-" + withdrawal.getId());
        assertThat(anonymized.getReason()).isEqualTo("OTHER");

        // 다른 학생의 정보는 그대로
        assertThat(userRepository.findById(ACTIVE_STUDENT)).isPresent();
        assertThat(counselingPostRepository.findById(otherPost.getId())).isPresent();
    }

    @Test
    void purgeTeacher_keepsStudentRecordsAndLeavesEmptyAccount() {
        User teacher = saveUser(WITHDRAWN_TEACHER, Role.TEACHER, false, now.minusDays(5));
        User student = saveUser(ACTIVE_STUDENT, Role.STUDENT, true, null);

        teacherNoticeRepository.save(TeacherNotice.builder().teacher(teacher).title("공지").content("내용").createdAt(now).build());
        inviteCodeRepository.save(TeacherInviteCode.builder().teacher(teacher).code("RT0001").createdAt(now).build());
        assignmentRepository.save(StudentTeacherAssignment.builder().teacher(teacher).student(student).assignedAt(now).build());
        suggestionPostRepository.save(suggestion(teacher));
        CounselingPost studentPost = counselingPostRepository.save(post(student, teacher));
        counselingAccessLogRepository.save(CounselingAccessLog.builder().counselingPost(studentPost).teacher(teacher).accessedAt(now).build());
        em.flush();

        assertThat(withdrawnUserPurger.purge(WITHDRAWN_TEACHER, now)).isTrue();

        User shell = userRepository.findById(WITHDRAWN_TEACHER).orElseThrow();
        assertThat(shell.getPurgedAt()).isNotNull();
        assertThat(shell.getName()).isEqualTo("탈퇴한 회원");
        assertThat(shell.getEmail()).isNull();
        assertThat(shell.getPhone()).isNull();
        assertThat(shell.isActive()).isFalse();

        assertThat(count("SELECT COUNT(n) FROM TeacherNotice n WHERE n.teacher.username = :u", WITHDRAWN_TEACHER)).isZero();
        assertThat(count("SELECT COUNT(c) FROM TeacherInviteCode c WHERE c.teacher.username = :u", WITHDRAWN_TEACHER)).isZero();
        assertThat(count("SELECT COUNT(a) FROM StudentTeacherAssignment a WHERE a.teacher.username = :u", WITHDRAWN_TEACHER)).isZero();
        assertThat(count("SELECT COUNT(s) FROM SuggestionPost s WHERE s.author.username = :u", WITHDRAWN_TEACHER)).isZero();

        // 학생이 쓴 상담 글과 열람 기록은 남음
        assertThat(counselingPostRepository.findById(studentPost.getId())).isPresent();
        assertThat(count("SELECT COUNT(l) FROM CounselingAccessLog l WHERE l.teacher.username = :u", WITHDRAWN_TEACHER)).isEqualTo(1);

        // 한 번 파기한 계정은 다시 처리하지 않음
        assertThat(withdrawnUserPurger.purge(WITHDRAWN_TEACHER, now)).isFalse();
    }

    @Test
    void purge_skipsActiveAndNotWithdrawnAccounts() {
        saveUser(ACTIVE_STUDENT, Role.STUDENT, true, null);
        saveUser(BLOCKED_STUDENT, Role.STUDENT, false, null);
        em.flush();

        assertThat(withdrawnUserPurger.purge(ACTIVE_STUDENT, now)).isFalse();
        assertThat(withdrawnUserPurger.purge(BLOCKED_STUDENT, now)).isFalse();
        assertThat(userRepository.findById(ACTIVE_STUDENT)).isPresent();
        assertThat(userRepository.findById(BLOCKED_STUDENT)).isPresent();
    }

    @Test
    void admin_cannotReactivatePurgedAccount() {
        saveUser(WITHDRAWN_TEACHER, Role.TEACHER, false, now.minusDays(5));
        em.flush();
        withdrawnUserPurger.purge(WITHDRAWN_TEACHER, now);

        assertThatThrownBy(() -> adminService.updateUserStatus("it-ret-admin", WITHDRAWN_TEACHER, true))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void purgeExpiredLogs_deletesOnlyOlderThanRetention() {
        User teacher = saveUser(ACTIVE_TEACHER, Role.TEACHER, true, null);
        User student = saveUser(ACTIVE_STUDENT, Role.STUDENT, true, null);
        CounselingPost post = counselingPostRepository.save(post(student, teacher));
        CounselingAccessLog oldLog = counselingAccessLogRepository.save(CounselingAccessLog.builder()
                .counselingPost(post).teacher(teacher).accessedAt(now.minusDays(731)).build());
        CounselingAccessLog recentLog = counselingAccessLogRepository.save(CounselingAccessLog.builder()
                .counselingPost(post).teacher(teacher).accessedAt(now.minusDays(30)).build());
        AdminActivityLog oldAdminLog = adminActivityLogRepository.save(AdminActivityLog.builder()
                .adminUsername("it-ret-admin").action("TEST").createdAt(now.minusDays(731)).build());
        UserWithdrawal oldWithdrawal = userWithdrawalRepository.save(UserWithdrawal.builder()
                .username("purged-old").role(Role.STUDENT).withdrawnAt(now.minusDays(366)).build());
        em.flush();

        dataRetentionService.purgeExpiredLogs(now);
        em.clear();

        assertThat(counselingAccessLogRepository.findById(oldLog.getId())).isEmpty();
        assertThat(counselingAccessLogRepository.findById(recentLog.getId())).isPresent();
        assertThat(adminActivityLogRepository.findById(oldAdminLog.getId())).isEmpty();
        assertThat(userWithdrawalRepository.findById(oldWithdrawal.getId())).isEmpty();
    }

    private User saveUser(String username, Role role, boolean active, LocalDateTime withdrawnAt) {
        return userRepository.save(User.builder()
                .username(username)
                .password("encoded")
                .role(role)
                .school(school)
                .name(username)
                .email(username + "@korea.kr")
                .phone("01012345678")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(now)
                .active(active)
                .withdrawnAt(withdrawnAt)
                .build());
    }

    private CounselingPost post(User student, User teacher) {
        return CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title("상담 제목")
                .content("상담 내용")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.CAREER)
                .status(CounselingStatus.WAITING)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private StudentPreCounselingProfile profile(User student) {
        return StudentPreCounselingProfile.builder()
                .student(student)
                .futureHope("교사")
                .favoriteWords("가")
                .personalityStrength("가")
                .personalityWeakness("가")
                .hobbiesSpecialtiesInterests("가")
                .happiestMoment("가")
                .stressfulMoment("가")
                .stressReliefMethod("가")
                .memorableSchoolMoment("가")
                .desiredFriendType("가")
                .desiredClassRole("가")
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private SuggestionPost suggestion(User author) {
        return SuggestionPost.builder()
                .author(author)
                .category(SuggestionCategory.FEATURE)
                .title("건의")
                .content("내용")
                .status(SuggestionStatus.OPEN)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private long count(String jpql, String username) {
        return em.createQuery(jpql, Long.class).setParameter("u", username).getSingleResult();
    }
}
