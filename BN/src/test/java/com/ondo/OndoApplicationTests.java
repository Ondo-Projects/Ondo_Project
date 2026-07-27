package com.ondo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "ondo.school.auto-import=false")
class OndoApplicationTests {

    @Test
    void contextLoads() {
    }
}
