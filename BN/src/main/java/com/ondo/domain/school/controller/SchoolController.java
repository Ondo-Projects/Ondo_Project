package com.ondo.domain.school.controller;

import com.ondo.domain.school.dto.SchoolResponseDTO;
import com.ondo.domain.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping("/search")
    public List<SchoolResponseDTO> search(
            @RequestParam String keyword,
            @RequestParam(required = false) String schoolType
    ) {
        return schoolService.search(keyword, schoolType);
    }
}
