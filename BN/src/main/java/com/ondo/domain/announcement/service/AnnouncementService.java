package com.ondo.domain.announcement.service;

import com.ondo.domain.announcement.dto.AnnouncementCreateDTO;
import com.ondo.domain.announcement.dto.AnnouncementResponseDTO;
import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import com.ondo.domain.announcement.repository.PlatformAnnouncementRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final PlatformAnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @Transactional
    public AnnouncementResponseDTO createAnnouncement(String adminUsername, AnnouncementCreateDTO request) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        PlatformAnnouncement announcement = PlatformAnnouncement.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .audience(request.getAudience())
                .admin(admin)
                .createdAt(LocalDateTime.now())
                .build();

        return new AnnouncementResponseDTO(announcementRepository.save(announcement));
    }

    public List<AnnouncementResponseDTO> getAdminAnnouncements(String adminUsername) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        return announcementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AnnouncementResponseDTO::new)
                .toList();
    }

    public List<AnnouncementResponseDTO> getCommonAnnouncements(String username) {
        User user = getUser(username);
        assertRoleIn(user, Role.STUDENT, Role.TEACHER);

        Set<AnnouncementAudience> audiences = audiencesForRole(user.getRole());

        return announcementRepository.findByAudienceInOrderByCreatedAtDesc(audiences).stream()
                .map(AnnouncementResponseDTO::new)
                .toList();
    }

    @Transactional
    public void deleteAnnouncement(String adminUsername, Long announcementId) {
        User admin = getUser(adminUsername);
        assertRole(admin, Role.ADMIN);

        PlatformAnnouncement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new BusinessException("삭제할 공지를 찾을 수 없습니다."));

        announcementRepository.delete(announcement);
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
