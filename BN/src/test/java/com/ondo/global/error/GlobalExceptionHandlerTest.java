package com.ondo.global.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleTooManyRequestsException_returns429WithErrorResponse() {
        var response = handler.handleTooManyRequestsException(
                new TooManyRequestsException("잠시 후 다시 시도해 주세요.")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("잠시 후 다시 시도해 주세요.");
    }

    @Test
    void handleForbiddenException_returns403WithErrorResponse() {
        var response = handler.handleForbiddenException(new ForbiddenException("접근 권한이 없습니다."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("접근 권한이 없습니다.");
    }

    @Test
    void handleBusinessException_returns400WithErrorResponse() {
        var response = handler.handleBusinessException(new BusinessException("잘못된 요청입니다."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("잘못된 요청입니다.");
    }
}
