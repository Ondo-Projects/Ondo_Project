package com.ondo.domain.user.service;

enum RecoveryPurpose {
    FIND_ID("find-id"),
    RESET_PASSWORD("reset-password");

    private final String keySegment;

    RecoveryPurpose(String keySegment) {
        this.keySegment = keySegment;
    }

    String keySegment() {
        return keySegment;
    }
}
