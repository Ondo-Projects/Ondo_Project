package com.ondo.domain.school.service;

import com.ondo.domain.school.dto.SchoolResponseDTO;
import com.ondo.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SchoolService {

    private final SchoolRepository schoolRepository;

    public List<SchoolResponseDTO> search(String keyword, String schoolType) {
        if (keyword == null || keyword.trim().length() < 2) {
            return List.of();
        }

        String trimmedKeyword = keyword.trim();
        List<SchoolResponseDTO> results;

        if (schoolType != null && !schoolType.isBlank()) {
            results = schoolRepository
                    .findTop30BySchoolNameContainingAndSchoolTypeOrderBySchoolNameAsc(trimmedKeyword, schoolType)
                    .stream()
                    .map(SchoolResponseDTO::new)
                    .toList();
        } else {
            results = schoolRepository.findTop30BySchoolNameContainingOrderBySchoolNameAsc(trimmedKeyword)
                    .stream()
                    .map(SchoolResponseDTO::new)
                    .toList();
        }

        return results;
    }
}
