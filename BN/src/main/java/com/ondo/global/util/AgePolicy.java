package com.ondo.global.util;

import java.time.LocalDate;
import java.time.Period;

public final class AgePolicy {

    private static final int GUARDIAN_CONSENT_AGE = 14;

    private AgePolicy() {
    }

    public static boolean isUnder14(LocalDate birthDate) {
        if (birthDate == null) {
            return false;
        }
        return Period.between(birthDate, LocalDate.now()).getYears() < GUARDIAN_CONSENT_AGE;
    }
}
