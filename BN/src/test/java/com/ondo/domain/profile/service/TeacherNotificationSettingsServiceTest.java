package com.ondo.domain.profile.service;

import com.ondo.domain.profile.dto.TeacherNotificationSettingsUpdateRequestDTO;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class TeacherNotificationSettingsServiceTest {

    private static final String TEACHER_USERNAME = "notify-teacher";

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TeacherNotificationSettingsService teacherNotificationSettingsService;

    private User teacher;

    @BeforeEach
    void setUp() {
        School school = School.builder()
                .schoolCode("NTF001")
                .schoolName("알림설정테스트중학교")
                .region("서울특별시")
                .schoolType("중")
                .build();

        teacher = User.builder()
                .username(TEACHER_USERNAME)
                .password("encoded")
                .role(Role.TEACHER)
                .school(school)
                .name("알림교사")
                .email("teacher@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getNotificationSettings_returnsDefaults() {
        org.mockito.Mockito.when(userRepository.findByUsername(TEACHER_USERNAME))
                .thenReturn(Optional.of(teacher));

        var response = teacherNotificationSettingsService.getNotificationSettings(TEACHER_USERNAME);

        assertThat(response.getPhone()).isNull();
        assertThat(response.isSmsNotifyEnabled()).isFalse();
        assertThat(response.isReady()).isFalse();
    }

    @Test
    void updateNotificationSettings_savesPhoneAndConsent() {
        org.mockito.Mockito.when(userRepository.findByUsername(TEACHER_USERNAME))
                .thenReturn(Optional.of(teacher));

        TeacherNotificationSettingsUpdateRequestDTO request = new TeacherNotificationSettingsUpdateRequestDTO();
        request.setPhone("010-1234-5678");
        request.setSmsNotifyEnabled(true);

        var response = teacherNotificationSettingsService.updateNotificationSettings(TEACHER_USERNAME, request);

        assertThat(response.getPhone()).isEqualTo("01012345678");
        assertThat(response.isSmsNotifyEnabled()).isTrue();
        assertThat(response.isReady()).isTrue();
        assertThat(response.getMessage()).contains("저장");
        assertThat(teacher.getPhone()).isEqualTo("01012345678");
        assertThat(teacher.isSmsNotifyEnabled()).isTrue();
    }

    @Test
    void updateNotificationSettings_clearPhoneTurnsOffConsent() {
        teacher.updateNotificationSettings("01012345678", true);
        org.mockito.Mockito.when(userRepository.findByUsername(TEACHER_USERNAME))
                .thenReturn(Optional.of(teacher));

        TeacherNotificationSettingsUpdateRequestDTO request = new TeacherNotificationSettingsUpdateRequestDTO();
        request.setPhone("");
        request.setSmsNotifyEnabled(true);

        assertThatThrownBy(() -> teacherNotificationSettingsService.updateNotificationSettings(TEACHER_USERNAME, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("휴대전화 번호");
    }

    @Test
    void updateNotificationSettings_invalidPhone_throwsBusinessException() {
        org.mockito.Mockito.when(userRepository.findByUsername(TEACHER_USERNAME))
                .thenReturn(Optional.of(teacher));

        TeacherNotificationSettingsUpdateRequestDTO request = new TeacherNotificationSettingsUpdateRequestDTO();
        request.setPhone("12345");
        request.setSmsNotifyEnabled(false);

        assertThatThrownBy(() -> teacherNotificationSettingsService.updateNotificationSettings(TEACHER_USERNAME, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("휴대전화");
    }
}
