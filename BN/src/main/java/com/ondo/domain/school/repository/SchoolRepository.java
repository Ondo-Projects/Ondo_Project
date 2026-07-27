package com.ondo.domain.school.repository;

import com.ondo.domain.school.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, String> {

    List<School> findTop30BySchoolNameContainingOrderBySchoolNameAsc(String schoolName);

    List<School> findTop30BySchoolNameContainingAndSchoolTypeOrderBySchoolNameAsc(String schoolName, String schoolType);
}
