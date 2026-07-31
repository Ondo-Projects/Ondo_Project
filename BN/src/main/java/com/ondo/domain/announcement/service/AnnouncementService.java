package com.ondo.domain.announcement.service;

import com.ondo.domain.announcement.dto.AnnouncementCreateDTO;
import com.ondo.domain.announcement.dto.AnnouncementPageResponseDTO;
import com.ondo.domain.announcement.dto.AnnouncementResponseDTO;
import com.ondo.domain.announcement.dto.AnnouncementSummaryDTO;
import com.ondo.domain.announcement.dto.AnnouncementUpdateDTO;
import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.AnnouncementStatus;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import com.ondo.domain.announcement.repository.PlatformAnnouncementRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final PlatformAnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @Transactional
    public AnnouncementResponseDTO createAnnouncement(String adminUsername, AnnouncementCreateDTO request) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        LocalDateTime now = LocalDateTime.now();
        PlatformAnnouncement announcement = PlatformAnnouncement.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .audience(request.getAudience())
                .admin(admin)
                .pinned(false)
                .status(AnnouncementStatus.PUBLISHED)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return new AnnouncementResponseDTO(announcementRepository.save(announcement));
    }

    public AnnouncementPageResponseDTO getAdminAnnouncements(String adminUsername, int page, int size) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        Page<PlatformAnnouncement> result = announcementRepository.findAll(createPageable(page, size));
        return toPageResponse(result);
    }

    public AnnouncementPageResponseDTO getCommonAnnouncements(String username, int page, int size) {
        User user = getUser(username);
        assertRoleIn(user, Role.STUDENT, Role.TEACHER);

        Set<AnnouncementAudience> audiences = audiencesForRole(user.getRole());
        Page<PlatformAnnouncement> result = announcementRepository.findByAudienceInAndStatus(
                audiences,
                AnnouncementStatus.PUBLISHED,
                createPageable(page, size)
        );

        return toPageResponse(result);
    }

    public AnnouncementResponseDTO getCommonAnnouncement(String username, Long announcementId) {
        User user = getUser(username);
        assertRoleIn(user, Role.STUDENT, Role.TEACHER);

        PlatformAnnouncement announcement = getPublishedAnnouncement(announcementId);
        assertVisibleToRole(announcement, user.getRole());

        return new AnnouncementResponseDTO(announcement);
    }

    @Transactional
    public AnnouncementResponseDTO updateAnnouncement(
            String adminUsername,
            Long announcementId,
            AnnouncementUpdateDTO request
    ) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        if (request.getTitle() != null && !StringUtils.hasText(request.getTitle())) {
            throw new BusinessException("제목을 입력해 주세요.");
        }
        if (request.getContent() != null && !StringUtils.hasText(request.getContent())) {
            throw new BusinessException("내용을 입력해 주세요.");
        }

        PlatformAnnouncement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new BusinessException("수정할 공지를 찾을 수 없습니다."));

        announcement.update(
                request.getTitle(),
                request.getContent(),
                request.getAudience(),
                request.getPinned(),
                request.getStatus()
        );

        return new AnnouncementResponseDTO(announcement);
    }

    @Transactional
    public void deleteAnnouncement(String adminUsername, Long announcementId) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        PlatformAnnouncement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new BusinessException("삭제할 공지를 찾을 수 없습니다."));

        announcementRepository.delete(announcement);
    }

    private PlatformAnnouncement getPublishedAnnouncement(Long announcementId) {
        PlatformAnnouncement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new BusinessException("공지를 찾을 수 없습니다."));

        if (announcement.getStatus() != AnnouncementStatus.PUBLISHED) {
            throw new BusinessException("공지를 찾을 수 없습니다.");
        }

        return announcement;
    }

    private void assertVisibleToRole(PlatformAnnouncement announcement, Role role) {
        Set<AnnouncementAudience> audiences = audiencesForRole(role);
        if (!audiences.contains(announcement.getAudience())) {
            throw new BusinessException("공지를 찾을 수 없습니다.");
        }
    }

    private AnnouncementPageResponseDTO toPageResponse(Page<PlatformAnnouncement> page) {
        return new AnnouncementPageResponseDTO(
                page.getContent().stream().map(AnnouncementSummaryDTO::new).toList(),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize()
        );
    }

    private Pageable createPageable(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        Sort sort = Sort.by(
                Sort.Order.desc("pinned"),
                Sort.Order.desc("createdAt")
        );
        return PageRequest.of(normalizedPage, normalizedSize, sort);
    }

    private Set<AnnouncementAudience> audiencesForRole(Role role) {
        if (role == Role.STUDENT) {
            return EnumSet.of(AnnouncementAudience.ALL, AnnouncementAudience.STUDENT);
        }
        if (role == Role.TEACHER) {
            return EnumSet.of(AnnouncementAudience.ALL, AnnouncementAudience.TEACHER);
        }
        throw new BusinessException("접근 권한이 없습니다.");
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private void assertRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
    }

    private void assertRoleIn(User user, Role... roles) {
        for (Role role : roles) {
            if (user.getRole() == role) {
                return;
            }
        }
        throw new BusinessException("접근 권한이 없습니다.");
    }
}
