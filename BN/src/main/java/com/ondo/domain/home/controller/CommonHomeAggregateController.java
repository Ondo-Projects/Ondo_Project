package com.ondo.domain.home.controller;

import com.ondo.domain.home.dto.CommonHomeAggregateResponseDTO;
import com.ondo.domain.home.service.CommonHomeAggregateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonHomeAggregateController {

    private final CommonHomeAggregateService commonHomeAggregateService;

    @GetMapping("/home")
    public ResponseEntity<CommonHomeAggregateResponseDTO> getHome(
            Authentication authentication,
            @RequestParam(defaultValue = "14") int days
    ) {
        return ResponseEntity.ok(commonHomeAggregateService.loadHome(authentication.getName(), days));
    }
}
