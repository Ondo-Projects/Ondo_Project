package com.ondo.domain.meal.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "ondo.school.auto-import=false",
        "ondo.neis.dev-mode=false"
})
@TestPropertySource(locations = "file:config/application-local.properties")
class NeisApiClientLiveSearchTest {

    @Autowired
    private NeisApiClient neisApiClient;

    @Test
    void searchSchoolRows_findsMugeukMiddleSchool() {
        JsonNode rows = neisApiClient.searchSchoolRows("무극중학교");
        assertThat(rows.isArray()).isTrue();
        assertThat(rows.size()).isGreaterThan(0);
    }
}
