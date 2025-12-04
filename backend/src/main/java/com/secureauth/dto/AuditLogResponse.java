package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse audit log
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private String username;
    private String action;
    private String details;
    private String ipAddress;
    private String userAgent;
    private Boolean success;
    private String errorMessage;
    private LocalDateTime timestamp;
}
