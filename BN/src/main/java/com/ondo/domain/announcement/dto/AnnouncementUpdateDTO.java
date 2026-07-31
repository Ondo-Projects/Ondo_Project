package com.ondo.domain.announcement.dto;

import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.AnnouncementStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnnouncementUpdateDTO {

    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    private String content;

    private AnnouncementAudience audience;

    private Boolean pinned;

    private AnnouncementStatus status;

    @AssertTrue(message = "수정할 항목을 하나 이상 입력해 주세요.")
    public boolean hasAtLeastOneField() {
        return title != null
                || content != null
                || audience != null
                || pinned != null
                || status != null;
    }
}
