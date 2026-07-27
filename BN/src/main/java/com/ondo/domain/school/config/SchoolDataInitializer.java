package com.ondo.domain.school.config;

import com.ondo.domain.school.service.SchoolCsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchoolDataInitializer implements CommandLineRunner {

    private final SchoolCsvImportService schoolCsvImportService;

    @Override
    public void run(String... args) {
        schoolCsvImportService.importIfNeeded();
    }
}
