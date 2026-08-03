package com.ondo.domain.user.policy;

import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TeacherEmailDomainsTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "teacher@sen.go.kr",
            "teacher@goe.go.kr",
            "teacher@gbe.kr",
            "teacher@korea.kr"
    })
    void validateTeacherEmail_allowsOfficialDomains(String email) {
        assertThatCode(() -> TeacherEmailDomains.validateTeacherEmail(email))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "teacher@gmail.com",
            "teacher@naver.com",
            "teacher@example.go.kr"
    })
    void validateTeacherEmail_rejectsOtherDomains(String email) {
        assertThatThrownBy(() -> TeacherEmailDomains.validateTeacherEmail(email))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("시·도교육청");
    }

    @Test
    void validateTeacherEmail_rejectsInvalidFormat() {
        assertThatThrownBy(() -> TeacherEmailDomains.validateTeacherEmail("@sen.go.kr"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("올바른 교사 이메일");
    }

    @Test
    void isAllowedDomain_isCaseInsensitive() {
        assertThatCode(() -> TeacherEmailDomains.validateTeacherEmail("teacher@SEN.go.kr"))
                .doesNotThrowAnyException();
    }
}
