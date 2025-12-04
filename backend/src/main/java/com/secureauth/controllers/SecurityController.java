package com.secureauth.controllers;

import com.secureauth.dto.*;
import com.secureauth.services.AuditService;
import com.secureauth.services.SecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller pour le Responsable Sécurité
 * Analyse des logs, alertes, exports
 */
@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
@Tag(name = "Security Operations", description = "API pour le responsable sécurité")
public class SecurityController {

    private final SecurityService securityService;
    private final AuditService auditService;

    @Operation(summary = "Obtenir les alertes de sécurité", description = "Liste des événements suspects")
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<SecurityAlertResponse>>> getSecurityAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        
        List<SecurityAlertResponse> alerts = securityService.getSecurityAlerts(severity, since);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @Operation(summary = "Analyser les connexions suspectes", description = "Détecte les patterns anormaux")
    @GetMapping("/suspicious-logins")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getSuspiciousLogins(
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<AuditLogResponse> logs = securityService.getSuspiciousLogins(ipAddress, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Exporter un rapport d'audit", description = "Génère un fichier CSV ou JSON")
    @PostMapping("/audit/export")
    public ResponseEntity<byte[]> exportAuditReport(@Valid @RequestBody AuditExportRequest request) {
        
        byte[] content = auditService.exportAuditReport(request);
        String filename = "audit_report_" + System.currentTimeMillis();
        
        HttpHeaders headers = new HttpHeaders();
        if ("CSV".equalsIgnoreCase(request.getFormat())) {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            filename += ".csv";
        } else {
            headers.setContentType(MediaType.APPLICATION_JSON);
            filename += ".json";
        }
        headers.setContentDispositionFormData("attachment", filename);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(content);
    }

    @Operation(summary = "Bloquer manuellement un compte", description = "Freeze temporaire pour investigation")
    @PostMapping("/users/{id}/freeze")
    public ResponseEntity<ApiResponse<UserResponse>> freezeUserAccount(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        
        UserResponse updated = securityService.freezeAccount(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Compte gelé avec succès", updated));
    }

    @Operation(summary = "Débloquer un compte gelé", description = "Réactive un compte après investigation")
    @PostMapping("/users/{id}/unfreeze")
    public ResponseEntity<ApiResponse<UserResponse>> unfreezeUserAccount(@PathVariable Long id) {
        
        UserResponse updated = securityService.unfreezeAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Compte dégelé avec succès", updated));
    }
}
