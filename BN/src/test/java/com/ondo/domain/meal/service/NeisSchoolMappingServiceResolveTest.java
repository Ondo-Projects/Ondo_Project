package com.ondo.domain.meal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.domain.meal.client.NeisApiClient;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.global.error.NeisMappingException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NeisSchoolMappingServiceResolveTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private NeisApiClient neisApiClient;

    @Mock
    private SchoolRepository schoolRepository;

    @InjectMocks
    private NeisSchoolMappingService neisSchoolMappingService;

    @Test
    void resolveNeisCodes_whenNoCandidates_throwsNeisMappingException() {
        School school = School.builder()
                .schoolCode("S110000618")
                .schoolName("무극중학교")
                .region("충청북도 음성군")
                .schoolType("중")
                .build();

        when(neisApiClient.searchSchoolForMapping(school)).thenReturn(objectMapper.createArrayNode());

        assertThatThrownBy(() -> neisSchoolMappingService.resolveNeisCodes(school))
                .isInstanceOf(NeisMappingException.class)
                .hasMessageContaining("무극중학교");

        verify(schoolRepository, never()).findById(any());
    }

    @Test
    void resolveNeisCodes_whenAlreadyMapped_skipsNeisSearch() {
        School school = School.builder()
                .schoolCode("S010000699")
                .schoolName("개포중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();
        school.updateNeisCodes("B10", "7130166");

        var result = neisSchoolMappingService.resolveNeisCodes(school);

        org.assertj.core.api.Assertions.assertThat(result.getOfficeCode()).isEqualTo("B10");
        org.assertj.core.api.Assertions.assertThat(result.getSchoolCode()).isEqualTo("7130166");
        verify(neisApiClient, never()).searchSchoolForMapping(any());
    }

    @Test
    void resolveNeisCodes_whenMatchFound_persistsCodes() throws Exception {
        School school = School.builder()
                .schoolCode("S010000699")
                .schoolName("개포중학교")
                .region("서울특별시 강남구")
                .schoolType("중")
                .build();

        String json = """
                [
                  {
                    "SCHUL_NM": "개포중학교",
                    "SCHUL_KND_SC_NM": "중학교",
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "7130166",
                    "ORG_RDNMA": "서울특별시 강남구 개포로"
                  }
                ]
                """;

        when(neisApiClient.searchSchoolForMapping(school)).thenReturn(objectMapper.readTree(json));
        when(schoolRepository.findById("S010000699")).thenReturn(Optional.of(school));

        var result = neisSchoolMappingService.resolveNeisCodes(school);

        org.assertj.core.api.Assertions.assertThat(result.getOfficeCode()).isEqualTo("B10");
        org.assertj.core.api.Assertions.assertThat(result.getSchoolCode()).isEqualTo("7130166");
        org.assertj.core.api.Assertions.assertThat(school.hasNeisCodes()).isTrue();
    }
}
