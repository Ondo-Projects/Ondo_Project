package com.ondo.domain.user.repository;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByEmailAndNameAndBirthDateAndActiveTrue(
            String email,
            String name,
            LocalDate birthDate
    );

    Optional<User> findByUsernameAndEmailAndActiveTrue(String username, String email);

    long countByRole(Role role);

    long countByRoleAndActive(Role role, boolean active);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.active = true WHERE u.active = false")
    int activateAllInactive();

    @Query("""
            SELECT u FROM User u JOIN u.school s
            WHERE (:role IS NULL OR u.role = :role)
            AND (
                :keyword = ''
                OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (:schoolCode = '' OR s.schoolCode = :schoolCode)
            """)
    Page<User> searchForAdmin(
            @Param("role") Role role,
            @Param("keyword") String keyword,
            @Param("schoolCode") String schoolCode,
            Pageable pageable
    );
}
