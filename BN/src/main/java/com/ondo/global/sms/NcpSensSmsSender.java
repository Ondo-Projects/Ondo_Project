package com.ondo.global.sms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ondo.global.config.NcpSensProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NcpSensSmsSender {

    private final NcpSensProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void sendSms(String phone, String content) {
        if (properties.isDevMode()) {
            log.info("[DEV][NCP SENS] SMS to {} : {}", phone, content);
            return;
        }

        validateConfig();

        try {
            String urlPath = "/sms/v2/services/" + properties.getServiceId() + "/messages";
            String requestUrl = properties.getApiUrl() + urlPath;
            String timestamp = String.valueOf(System.currentTimeMillis());

            Map<String, Object> body = Map.of(
                    "type", "SMS",
                    "contentType", "COMM",
                    "countryCode", "82",
                    "from", normalizePhone(properties.getSenderPhone()),
                    "content", content,
                    "messages", List.of(Map.of("to", phone))
            );

            String jsonBody = objectMapper.writeValueAsString(body);
            HttpHeaders headers = buildHeaders(HttpMethod.POST, urlPath, timestamp);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    requestUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(jsonBody, headers),
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("SMS 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
            }
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException | java.io.IOException exception) {
            log.error("NCP SENS SMS send failed", exception);
            throw new BusinessException("SMS 발송 중 오류가 발생했습니다.");
        }
    }

    private HttpHeaders buildHeaders(HttpMethod method, String urlPath, String timestamp) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-ncp-apigw-timestamp", timestamp);
        headers.set("x-ncp-iam-access-key", properties.getAccessKey());
        headers.set("x-ncp-apigw-signature-v2", makeSignature(method.name(), urlPath, timestamp));
        return headers;
    }

    private String makeSignature(String method, String urlPath, String timestamp) {
        try {
            String message = method + " " + urlPath + "\n" + timestamp + "\n" + properties.getAccessKey();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getSecretKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new BusinessException("SMS 서명 생성에 실패했습니다.");
        }
    }

    private void validateConfig() {
        if (properties.getAccessKey().isBlank()
                || properties.getSecretKey().isBlank()
                || properties.getServiceId().isBlank()
                || properties.getSenderPhone().isBlank()) {
            throw new BusinessException("SMS 서비스 설정이 완료되지 않았습니다.");
        }
    }

    public static String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9]", "");
    }

    public static void validatePhone(String phone) {
        String normalized = normalizePhone(phone);
        if (!normalized.matches("^01[0-9]{8,9}$")) {
            throw new BusinessException("올바른 휴대전화 번호를 입력해 주세요.");
        }
    }
}
