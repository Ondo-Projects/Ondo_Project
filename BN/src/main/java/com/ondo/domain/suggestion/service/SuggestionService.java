package com.ondo.domain.suggestion.service;

import com.ondo.domain.admin.dto.AdminPageResponseDTO;
import com.ondo.domain.admin.entity.AdminActivityLog;
import com.ondo.domain.admin.repository.AdminActivityLogRepository;
import com.ondo.domain.suggestion.dto.AdminSuggestionSummaryDTO;
import com.ondo.domain.suggestion.dto.SuggestionCreateDTO;
import com.ondo.domain.suggestion.dto.SuggestionReplyDTO;
import com.ondo.domain.suggestion.dto.SuggestionResponseDTO;
import com.ondo.domain.suggestion.dto.SuggestionStatusUpdateDTO;
import com.ondo.domain.suggestion.dto.SuggestionUpdateDTO;
import com.ondo.domain.suggestion.entity.SuggestionCategory;
import com.ondo.domain.suggestion.entity.SuggestionPost;
import com.ondo.domain.suggestion.entity.SuggestionStatus;
import com.ondo.domain.suggestion.repository.SuggestionPostRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SuggestionService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final SuggestionPostRepository suggestionPostRepository;
    private final UserRepository userRepository;
    private final AdminActivityLogRepository adminActivityLogRepository;

    @Transactional
    public SuggestionResponseDTO create(String username, Role expectedRole, SuggestionCreateDTO request) {
        User author = getUser(username);
        assertRole(author, expectedRole);

        LocalDateTime now = LocalDateTime.now();
        SuggestionPost post = SuggestionPost.builder()
                .author(author)
                .category(request.getCategory())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .status(SuggestionStatus.OPEN)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return new SuggestionResponseDTO(suggestionPostRepository.save(post));
    }

    public List<SuggestionResponseDTO> getMyPosts(String username, Role expectedRole) {
        User author = getUser(username);
        assertRole(author, expectedRole);

        return suggestionPostRepository.findByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(author).stream()
                .map(SuggestionResponseDTO::new)
                .toList();
    }

    public SuggestionResponseDTO getPost(String username, Role expectedRole, Long id) {
        User user = getUser(username);
        assertRole(user, expectedRole);

        SuggestionPost post = getActivePost(id);
        assertCanAccess(post, user);
        return new SuggestionResponseDTO(post);
    }

    @Transactional
    public SuggestionResponseDTO update(String username, Role expectedRole, Long id, SuggestionUpdateDTO request) {
        User author = getUser(username);
        assertRole(author, expectedRole);

        SuggestionPost post = getActivePost(id);
        assertOwner(post, author);
        assertEditable(post);

        post.update(
                request.getTitle().trim(),
                request.getContent().trim(),
                request.getCategory()
        );

        return new SuggestionResponseDTO(post);
    }

    @Transactional
    public void delete(String username, Role expectedRole, Long id) {
        User author = getUser(username);
        assertRole(author, expectedRole);

        SuggestionPost post = getActivePost(id);
        assertOwner(post, author);
        assertEditable(post);

        post.softDelete();
    }

    public AdminPageResponseDTO<AdminSuggestionSummaryDTO> searchForAdmin(
            String adminUsername,
            String statusParam,
            String categoryParam,
            String roleParam,
            String keyword,
            int page,
            int size
    ) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        Pageable pageable = PageRequest.of(page, normalizeSize(size));
        Page<SuggestionPost> result = suggestionPostRepository.searchForAdmin(
                parseStatus(statusParam),
                parseCategory(categoryParam),
                parseRole(roleParam),
                normalizeKeyword(keyword),
                pageable
        );

        return toPageResponse(result.map(AdminSuggestionSummaryDTO::from));
    }

    public SuggestionResponseDTO getPostForAdmin(String adminUsername, Long id) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        return new SuggestionResponseDTO(getActivePost(id));
    }

    @Transactional
    public SuggestionResponseDTO updateStatus(String adminUsername, Long id, SuggestionStatusUpdateDTO request) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        SuggestionPost post = getActivePost(id);
        assertStatusTransition(post, request.getStatus());

        SuggestionStatus previousStatus = post.getStatus();
        post.changeStatus(request.getStatus());

        saveActivity(
                admin.getUsername(),
                "SUGGESTION_STATUS_CHANGE",
                post.getAuthor().getUsername(),
                "suggestionId=" + post.getId() + ", from=" + previousStatus + ", to=" + request.getStatus()
        );

        return new SuggestionResponseDTO(post);
    }

    @Transactional
    public SuggestionResponseDTO reply(String adminUsername, Long id, SuggestionReplyDTO request) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        SuggestionPost post = getActivePost(id);
        post.reply(request.getReply().trim(), admin);

        saveActivity(
                admin.getUsername(),
                "SUGGESTION_REPLY",
                post.getAuthor().getUsername(),
                "suggestionId=" + post.getId()
        );

        return new SuggestionResponseDTO(post);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private SuggestionPost getActivePost(Long id) {
        return suggestionPostRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException("건의 글을 찾을 수 없습니다."));
    }

    private void assertRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
    }

    private void assertCanAccess(SuggestionPost post, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (post.isOwnedBy(user)) {
            return;
        }
        throw new ForbiddenException("접근 권한이 없습니다.");
    }

    private void assertOwner(SuggestionPost post, User author) {
        if (!post.isOwnedBy(author)) {
            throw new BusinessException("본인이 작성한 건의 글만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private void assertEditable(SuggestionPost post) {
        if (!post.isEditable()) {
            throw new BusinessException("접수 상태의 건의 글만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private void assertStatusTransition(SuggestionPost post, SuggestionStatus newStatus) {
        if (!post.canTransitionTo(newStatus)) {
            throw new BusinessException("현재 상태에서 해당 상태로 변경할 수 없습니다.");
        }
    }

    private void saveActivity(String adminUsername, String action, String targetUsername, String detail) {
        adminActivityLogRepository.save(AdminActivityLog.builder()
                .adminUsername(adminUsername)
                .action(action)
                .targetUsername(targetUsername)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private SuggestionStatus parseStatus(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        return SuggestionStatus.valueOf(statusParam.trim().toUpperCase());
    }

    private SuggestionCategory parseCategory(String categoryParam) {
        if (categoryParam == null || categoryParam.isBlank()) {
            return null;
        }
        return SuggestionCategory.valueOf(categoryParam.trim().toUpperCase());
    }

    private Role parseRole(String roleParam) {
        if (roleParam == null || roleParam.isBlank()) {
            return null;
        }
        return Role.valueOf(roleParam.trim().toUpperCase());
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null ? "" : keyword.trim();
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private <T> AdminPageResponseDTO<T> toPageResponse(Page<T> page) {
        return new AdminPageResponseDTO<>(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize()
        );
    }
}
