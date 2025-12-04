package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyResponse {
    private Long id;
    private String name;
    private String description;
    private String keyPrefix;
    private String fullKey; // Only returned on creation
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime lastUsedAt;
    private Boolean active;
}
