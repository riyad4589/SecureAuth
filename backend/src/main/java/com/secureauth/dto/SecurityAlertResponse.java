package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour les alertes de sécurité
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityAlertResponse {
    
    private Long id;
    private String alertType; // FAILED_LOGIN, ACCOUNT_LOCKED, SUSPICIOUS_ACTIVITY
    private String username;
    private String ipAddress;
    private Integer failedAttempts;
    private LocalDateTime timestamp;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String description;
}
