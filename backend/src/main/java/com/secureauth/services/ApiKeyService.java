package com.secureauth.services;

import com.secureauth.dto.ApiKeyResponse;
import com.secureauth.dto.CreateApiKeyRequest;
import com.secureauth.entities.ApiKey;
import com.secureauth.entities.User;
import com.secureauth.exceptions.BadRequestException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.ApiKeyRepository;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    private static final String API_KEY_PREFIX = "sk_";
    private static final int API_KEY_LENGTH = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public ApiKeyResponse createApiKey(String username, CreateApiKeyRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Generate secure API key
        String apiKey = generateApiKey();
        String keyHash = hashApiKey(apiKey);
        String keyPrefix = apiKey.substring(0, Math.min(10, apiKey.length()));

        // Calculate expiration
        LocalDateTime expiresAt = null;
        if (request.getExpirationDays() != null && request.getExpirationDays() > 0) {
            expiresAt = LocalDateTime.now().plusDays(request.getExpirationDays());
        }

        ApiKey apiKeyEntity = ApiKey.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .keyHash(keyHash)
                .keyPrefix(keyPrefix)
                .createdAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .active(true)
                .build();

        ApiKey saved = apiKeyRepository.save(apiKeyEntity);

        auditService.logAction("API_KEY_CREATED", username, 
                "API key created: " + request.getName(), true);

        log.info("API key created for user: {}, name: {}", username, request.getName());

        return ApiKeyResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .keyPrefix(saved.getKeyPrefix())
                .fullKey(apiKey) // Only returned on creation
                .createdAt(saved.getCreatedAt())
                .expiresAt(saved.getExpiresAt())
                .active(saved.getActive())
                .build();
    }

    public List<ApiKeyResponse> getUserApiKeys(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<ApiKey> apiKeys = apiKeyRepository.findByUserId(user.getId());

        return apiKeys.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeApiKey(String username, Long apiKeyId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new ResourceNotFoundException("API Key", "id", apiKeyId));

        if (!apiKey.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only revoke your own API keys");
        }

        apiKey.revoke();
        apiKeyRepository.save(apiKey);

        auditService.logAction("API_KEY_REVOKED", username, 
                "API key revoked: " + apiKey.getName(), true);

        log.info("API key revoked: {} for user: {}", apiKey.getName(), username);
    }

    @Transactional
    public boolean validateApiKey(String apiKey) {
        String keyHash = hashApiKey(apiKey);

        return apiKeyRepository.findByKeyHash(keyHash)
                .map(key -> {
                    if (!key.getActive()) {
                        return false;
                    }
                    if (key.isExpired()) {
                        return false;
                    }
                    // Update last used timestamp
                    key.updateLastUsed();
                    apiKeyRepository.save(key);
                    return true;
                })
                .orElse(false);
    }

    public User getUserByApiKey(String apiKey) {
        String keyHash = hashApiKey(apiKey);

        return apiKeyRepository.findByKeyHashWithUser(keyHash)
                .filter(key -> key.getActive() && !key.isExpired())
                .map(ApiKey::getUser)
                .orElse(null);
    }

    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    @Transactional
    public void cleanupExpiredApiKeys() {
        List<ApiKey> expiredKeys = apiKeyRepository
                .findByExpiresAtBeforeAndActiveTrue(LocalDateTime.now());

        expiredKeys.forEach(key -> {
            key.revoke();
            apiKeyRepository.save(key);
        });

        if (!expiredKeys.isEmpty()) {
            log.info("Revoked {} expired API keys", expiredKeys.size());
        }
    }

    private String generateApiKey() {
        byte[] randomBytes = new byte[API_KEY_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        return API_KEY_PREFIX + encoded;
    }

    private String hashApiKey(String apiKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(apiKey.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash API key", e);
        }
    }

    private ApiKeyResponse mapToResponse(ApiKey apiKey) {
        return ApiKeyResponse.builder()
                .id(apiKey.getId())
                .name(apiKey.getName())
                .description(apiKey.getDescription())
                .keyPrefix(apiKey.getKeyPrefix())
                .createdAt(apiKey.getCreatedAt())
                .expiresAt(apiKey.getExpiresAt())
                .lastUsedAt(apiKey.getLastUsedAt())
                .active(apiKey.getActive())
                .build();
    }
}
