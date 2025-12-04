package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour l'export des logs d'audit
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditExportRequest {
    
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String action;
    private String username;
    private String ipAddress;
    private String format; // JSON ou CSV
}
