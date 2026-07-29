package com.ondo.domain.profile.service;

import com.ondo.domain.profile.dto.StudentClassProfileUpdateRequestDTO;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentClassProfileServiceTest {

    private static final String STUDENT_USERNAME = "class-profile-student";

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StudentClassProfileService studentClassProfileService;

    private School middleSchool;
    private User student;

    @BeforeEach
    void setUp() {
        middleSchool = School.builder()
                .schoolCode("ITCP001")
                .schoolName("학년반테스트중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        student = User.builder()
                .username(STUDENT_USERNAME)
                .password("encoded")
                .role(Role.STUDENT)
                .school(middleSchool)
                .name("학년반학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        when(userRepository.findByUsername(STUDENT_USERNAME)).thenReturn(Optional.of(student));
    }

    @Test
    void getClassProfile_whenEmpty_returnsNotCompleted() {
        var response = studentClassProfileService.getClassProfile(STUDENT_USERNAME);

        assertThat(response.isCompleted()).isFalse();
        assertThat(response.getGrade()).isNull();
        assertThat(response.getClassNumber()).isNull();
    }

    @Test
    void updateClassProfile_validValues_returnsCompleted() {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(2);
        request.setClassNumber(5);

        var response = studentClassProfileService.updateClassProfile(STUDENT_USERNAME, request);

        assertThat(response.isCompleted()).isTrue();
        assertThat(response.getGrade()).isEqualTo(2);
        assertThat(response.getClassNumber()).isEqualTo(5);
        assertThat(response.getMessage()).contains("저장");
        assertThat(student.getGrade()).isEqualTo(2);
        assertThat(student.getClassNumber()).isEqualTo(5);
    }

    @Test
    void updateClassProfile_clearValues_resetsProfile() {
        student.updateClassProfile(1, 1);

        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        var response = studentClassProfileService.updateClassProfile(STUDENT_USERNAME, request);

        assertThat(response.isCompleted()).isFalse();
        assertThat(student.getGrade()).isNull();
        assertThat(student.getClassNumber()).isNull();
    }

    @Test
    void updateClassProfile_partialValues_throwsBusinessException() {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(2);

        assertThatThrownBy(() -> studentClassProfileService.updateClassProfile(STUDENT_USERNAME, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("함께 입력");
    }

    @Test
    void updateClassProfile_invalidGrade_throwsBusinessException() {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(4);
        request.setClassNumber(1);

        assertThatThrownBy(() -> studentClassProfileService.updateClassProfile(STUDENT_USERNAME, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("1~3");
    }

    @Test
    void updateClassProfile_invalidClassNumber_throwsBusinessException() {
        StudentClassProfileUpdateRequestDTO request = new StudentClassProfileUpdateRequestDTO();
        request.setGrade(1);
        request.setClassNumber(21);

        assertThatThrownBy(() -> studentClassProfileService.updateClassProfile(STUDENT_USERNAME, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("1~20");
    }
}
