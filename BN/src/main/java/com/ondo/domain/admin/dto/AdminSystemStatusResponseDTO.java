package com.ondo.domain.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminSystemStatusResponseDTO {

    private final boolean neisDevMode;
    private final boolean neisApiKeyConfigured;
    private final boolean weatherDevMode;
    private final boolean weatherApiKeyConfigured;
    private final boolean encryptionDevMode;
    private final boolean encryptionKeyConfigured;
}
