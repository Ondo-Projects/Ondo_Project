package com.ondo.domain.suggestion.repository;

import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SuggestionPostRepository extends JpaRepository<SuggestionPost, Long> {

    List<SuggestionPost> findByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(User author);

    Optional<SuggestionPost> findByIdAndDeletedAtIsNull(Long id);

    Optional<SuggestionPost> findByIdAndAuthorAndDeletedAtIsNull(Long id, User author);

    @Query("""
            SELECT p FROM SuggestionPost p
            JOIN p.author a
            WHERE p.deletedAt IS NULL
            AND (:status IS NULL OR p.status = :status)
            AND (:category IS NULL OR p.category = :category)
            AND (:role IS NULL OR a.role = :role)
            AND (
                :keyword = ''
                OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            ORDER BY p.createdAt DESC
            """)
    Page<SuggestionPost> searchForAdmin(
            @Param("status") SuggestionStatus status,
            @Param("category") SuggestionCategory category,
            @Param("role") Role role,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
