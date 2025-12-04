package com.secureauth.services;

import com.secureauth.dto.AuditLogResponse;
import com.secureauth.entities.AuditLog;
import com.secureauth.repositories.AuditLogRepository;
import com.secureauth.utils.NetworkUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion de l'audit
 * Journalise toutes les actions critiques du système
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Enregistre une action dans l'audit log
     */
    @Transactional
    public void logAction(String username, String action, String details, boolean success) {
        try {
            HttpServletRequest request = getCurrentRequest();
            
            AuditLog auditLog = AuditLog.builder()
                    .username(username)
                    .action(action)
                    .details(details)
                    .success(success)
                    .ipAddress(request != null ? NetworkUtils.getClientIpAddress(request) : "Unknown")
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created: {} - {} - {}", username, action, success);
        } catch (Exception e) {
            log.error("Error creating audit log", e);
        }
    }

    /**
     * Enregistre une action réussie
     */
    public void logSuccess(String username, String action, String details) {
        logAction(username, action, details, true);
    }

    /**
     * Enregistre une action échouée
     */
    public void logFailure(String username, String action, String errorMessage) {
        HttpServletRequest request = getCurrentRequest();
        
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action(action)
                .success(false)
                .errorMessage(errorMessage)
                .ipAddress(request != null ? NetworkUtils.getClientIpAddress(request) : "Unknown")
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .build();
        
        auditLogRepository.save(auditLog);
        log.warn("Audit log failure: {} - {} - {}", username, action, errorMessage);
    }

    /**
     * Récupère tous les logs avec pagination
     */
    public Page<AuditLogResponse> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Recherche les logs par username
     */
    public Page<AuditLogResponse> getLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByUsername(username, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Recherche les logs par action
     */
    public Page<AuditLogResponse> getLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Recherche les logs avec filtres multiples
     */
    public Page<AuditLogResponse> getLogsWithFilters(
            String username,
            String action,
            Boolean success,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        
        return auditLogRepository.findByFilters(username, action, success, startDate, endDate, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Récupère les derniers logs d'un utilisateur
     */
    public List<AuditLogResponse> getRecentLogsByUsername(String username) {
        return auditLogRepository.findTop10ByUsernameOrderByTimestampDesc(username)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère la requête HTTP courante
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = 
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * Extrait l'adresse IP du client
     */
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "Unknown";
        }
        
        String ip = null;
        
        // Check X-Forwarded-For header (when behind proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            ip = xForwardedFor.split(",")[0].trim();
        }
        
        // Check X-Real-IP header
        if (ip == null || ip.isEmpty()) {
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                ip = xRealIp;
            }
        }
        
        // Check other common proxy headers
        if (ip == null || ip.isEmpty()) {
            String[] headers = {
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
            };
            for (String header : headers) {
                String value = request.getHeader(header);
                if (value != null && !value.isEmpty() && !"unknown".equalsIgnoreCase(value)) {
                    ip = value;
                    break;
                }
            }
        }
        
        // Fallback to remote address
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        
        // Convert IPv6 localhost to IPv4 for readability
        if (ip != null) {
            if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
                ip = "127.0.0.1";
            }
        }
        
        return ip != null ? ip : "Unknown";
    }

    /**
     * Mappe AuditLog vers AuditLogResponse
     */
    private AuditLogResponse mapToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .username(auditLog.getUsername())
                .action(auditLog.getAction())
                .details(auditLog.getDetails())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .success(auditLog.getSuccess())
                .errorMessage(auditLog.getErrorMessage())
                .timestamp(auditLog.getTimestamp())
                .build();
    }

    /**
     * Exporte le rapport d'audit en JSON ou CSV
     */
    public byte[] exportAuditReport(com.secureauth.dto.AuditExportRequest request) {
        LocalDateTime start = request.getStartDate() != null ? 
                request.getStartDate() : LocalDateTime.now().minusDays(30);
        LocalDateTime end = request.getEndDate() != null ? 
                request.getEndDate() : LocalDateTime.now();

        List<AuditLog> logs = auditLogRepository.findAllByTimestampBetween(start, end);

        // Filtrer par action si spécifié
        if (request.getAction() != null && !request.getAction().isEmpty()) {
            logs = logs.stream()
                    .filter(log -> log.getAction().contains(request.getAction()))
                    .collect(Collectors.toList());
        }

        // Filtrer par username si spécifié
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            logs = logs.stream()
                    .filter(log -> log.getUsername().contains(request.getUsername()))
                    .collect(Collectors.toList());
        }

        // Filtrer par IP si spécifié
        if (request.getIpAddress() != null && !request.getIpAddress().isEmpty()) {
            logs = logs.stream()
                    .filter(log -> log.getIpAddress() != null && 
                            log.getIpAddress().contains(request.getIpAddress()))
                    .collect(Collectors.toList());
        }

        // Génère le contenu
        if ("CSV".equalsIgnoreCase(request.getFormat())) {
            return exportToCsv(logs);
        } else {
            return exportToJson(logs);
        }
    }

    private byte[] exportToCsv(List<AuditLog> logs) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Username,Action,IP Address,Details,Success,Timestamp\n");

        for (AuditLog log : logs) {
            csv.append(log.getId()).append(",")
               .append(log.getUsername()).append(",")
               .append(log.getAction()).append(",")
               .append(log.getIpAddress() != null ? log.getIpAddress() : "").append(",")
               .append("\"").append(log.getDetails() != null ? log.getDetails().replace("\"", "\"\"") : "").append("\",")
               .append(log.getSuccess()).append(",")
               .append(log.getTimestamp()).append("\n");
        }

        return csv.toString().getBytes();
    }

    private byte[] exportToJson(List<AuditLog> logs) {
        List<AuditLogResponse> responses = logs.stream()
                .map(log -> AuditLogResponse.builder()
                        .id(log.getId())
                        .username(log.getUsername())
                        .action(log.getAction())
                        .ipAddress(log.getIpAddress())
                        .details(log.getDetails())
                        .userAgent(log.getUserAgent())
                        .success(log.getSuccess())
                        .errorMessage(log.getErrorMessage())
                        .timestamp(log.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            return mapper.writeValueAsBytes(responses);
        } catch (Exception e) {
            log.error("Error exporting to JSON", e);
            return "[]".getBytes();
        }
    }
}
