package com.ondo.domain.user.entity;

public enum GuardianRelation {
    FATHER("부"),
    MOTHER("모"),
    OTHER("기타");

    private final String label;

    GuardianRelation(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
