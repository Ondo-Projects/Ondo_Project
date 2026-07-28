package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminDashboardResponseDTO {

    private final long totalUsers;
    private final long studentCount;
    private final long teacherCount;
    private final long adminCount;
    private final long totalSchools;
    private final long neisMappedSchools;
    private final long totalCounselingPosts;
    private final long counselingPostsToday;
    private final long counselingAccessLogsToday;
    private final long preCounselAccessLogsToday;
}
