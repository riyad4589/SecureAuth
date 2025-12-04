package com.secureauth.controllers;

import com.secureauth.dto.ApiResponse;
import com.secureauth.dto.AuditLogResponse;
import com.secureauth.services.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller de gestion de l'audit
 * Endpoints: consultation des logs, filtrage
 */
@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Management", description = "API de consultation des logs d'audit")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
public class AuditController {

    private final AuditService auditService;

    @Operation(summary = "Récupérer tous les logs", description = "Liste paginée de tous les logs d'audit")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ? 
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<AuditLogResponse> logs = auditService.getAllLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Rechercher les logs par username", description = "Logs d'un utilisateur spécifique")
    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getLogsByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogResponse> logs = auditService.getLogsByUsername(username, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Rechercher les logs par action", description = "Logs d'un type d'action spécifique")
    @GetMapping("/action/{action}")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getLogsByAction(
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogResponse> logs = auditService.getLogsByAction(action, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Rechercher avec filtres", description = "Recherche avancée avec filtres multiples")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> searchLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogResponse> logs = auditService.getLogsWithFilters(
                username, action, success, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @Operation(summary = "Logs récents d'un utilisateur", description = "10 derniers logs d'un utilisateur")
    @GetMapping("/recent/{username}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getRecentLogs(@PathVariable String username) {
        List<AuditLogResponse> logs = auditService.getRecentLogsByUsername(username);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
