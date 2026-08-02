package com.ondo.domain.school.service;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchoolCsvImportService {

    private static final int IMPORT_THRESHOLD = 1000;
    private static final int BATCH_SIZE = 500;

    private final SchoolRepository schoolRepository;

    @Value("${ondo.school.auto-import:true}")
    private boolean autoImport;

    public void importIfNeeded() {
        if (!autoImport) {
            return;
        }

        long count = schoolRepository.count();
        if (count >= IMPORT_THRESHOLD) {
            log.info("학교 데이터가 이미 적재되어 있습니다. ({}건)", count);
            return;
        }

        if (count > 0) {
            log.info("기존 학교 {}건 유지, CSV에서 없는 학교만 추가합니다.", count);
        }

        int imported = importMissingSchools();
        log.info("전국 중·고등학교 데이터 적재 완료: {}건 추가", imported);
    }

    @Transactional
    public int syncFromCsv() {
        List<School> schools = new ArrayList<>();
        schools.addAll(parseCsv("data/schools/middle_schools.csv", "중"));
        schools.addAll(parseCsv("data/schools/high_schools.csv", "고"));

        for (int i = 0; i < schools.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, schools.size());
            schoolRepository.saveAll(schools.subList(i, end));
        }

        log.info("학교 CSV 동기화 완료: {}건", schools.size());
        return schools.size();
    }

    @Transactional
    public int importAll() {
        return importMissingSchools();
    }

    @Transactional
    public int importMissingSchools() {
        List<School> schools = new ArrayList<>();
        schools.addAll(parseCsv("data/schools/middle_schools.csv", "중"));
        schools.addAll(parseCsv("data/schools/high_schools.csv", "고"));

        List<School> toSave = schools.stream()
                .filter(school -> !schoolRepository.existsById(school.getSchoolCode()))
                .toList();

        for (int i = 0; i < toSave.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, toSave.size());
            schoolRepository.saveAll(toSave.subList(i, end));
        }

        return toSave.size();
    }

    private List<School> parseCsv(String classpathLocation, String schoolType) {
        List<School> schools = new ArrayList<>();

        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean headerSkipped = false;

                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) {
                        continue;
                    }
                    if (!headerSkipped) {
                        headerSkipped = true;
                        continue;
                    }

                    School school = parseLine(line, schoolType);
                    if (school != null) {
                        schools.add(school);
                    }
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException("학교 CSV 파일을 읽을 수 없습니다: " + classpathLocation, exception);
        }

        log.info("{} {}건 파싱 완료", schoolType.equals("중") ? "중학교" : "고등학교", schools.size());
        return schools;
    }

    private School parseLine(String line, String schoolType) {
        String[] columns = line.split(",", -1);
        if (columns.length < 5) {
            return null;
        }

        String schoolCode = null;
        String schoolName = null;
        String region = null;

        for (int i = 0; i < columns.length; i++) {
            String value = columns[i].trim();
            if (value.matches("^S\\d+$")) {
                schoolCode = value;
                if (i + 1 < columns.length) {
                    schoolName = columns[i + 1].trim();
                }
                if (i >= 2) {
                    region = columns[i - 1].trim();
                }
                break;
            }
        }

        if (schoolCode == null || schoolName == null || schoolName.isBlank()) {
            return null;
        }

        return School.builder()
                .schoolCode(schoolCode)
                .schoolName(schoolName)
                .region(region)
                .schoolType(schoolType)
                .build();
    }
}
