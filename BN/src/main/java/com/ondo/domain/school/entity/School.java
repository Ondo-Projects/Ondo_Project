package com.ondo.domain.school.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "schools", indexes = {
        @Index(name = "idx_school_name", columnList = "schoolName"),
        @Index(name = "idx_school_type", columnList = "schoolType")
})
@Getter
@NoArgsConstructor
public class School {

    @Id
    @Column(length = 20)
    private String schoolCode;

    @Column(nullable = false, length = 100)
    private String schoolName;

    @Column(length = 50)
    private String region;

    @Column(length = 20)
    private String schoolType;

    @Builder
    public School(String schoolCode, String schoolName, String region, String schoolType) {
        this.schoolCode = schoolCode;
        this.schoolName = schoolName;
        this.region = region;
        this.schoolType = schoolType;
    }
}
