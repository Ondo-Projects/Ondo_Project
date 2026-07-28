package com.ondo.domain.school.repository;

import com.ondo.domain.school.entity.School;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, String> {

    List<School> findTop30BySchoolNameContainingOrderBySchoolNameAsc(String schoolName);

    List<School> findTop30BySchoolNameContainingAndSchoolTypeOrderBySchoolNameAsc(String schoolName, String schoolType);

    @Query("""
            SELECT COUNT(s) FROM School s
            WHERE s.neisOfficeCode IS NOT NULL AND s.neisOfficeCode <> ''
            AND s.neisSchoolCode IS NOT NULL AND s.neisSchoolCode <> ''
            """)
    long countNeisMapped();

    @Query("""
            SELECT s FROM School s
            WHERE (
                :keyword = ''
                OR LOWER(s.schoolName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(s.region, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(s.schoolCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (
                :mapped IS NULL
                OR (:mapped = TRUE AND s.neisOfficeCode IS NOT NULL AND s.neisOfficeCode <> ''
                    AND s.neisSchoolCode IS NOT NULL AND s.neisSchoolCode <> '')
                OR (:mapped = FALSE AND (s.neisOfficeCode IS NULL OR s.neisOfficeCode = ''
                    OR s.neisSchoolCode IS NULL OR s.neisSchoolCode = ''))
            )
            """)
    Page<School> searchForAdmin(
            @Param("keyword") String keyword,
            @Param("mapped") Boolean mapped,
            Pageable pageable
    );
}
