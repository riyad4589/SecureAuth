package com.secureauth.services;

import com.secureauth.dto.AuditLogResponse;
import com.secureauth.dto.SecurityAlertResponse;
import com.secureauth.dto.UserResponse;
import com.secureauth.entities.AuditLog;
import com.secureauth.entities.User;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.AuditLogRepository;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service pour le Responsable Sécurité
 * Gestion des alertes, analyse des logs, détection d'anomalies
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;

    /**
     * Récupère les alertes de sécurité
     */
    public List<SecurityAlertResponse> getSecurityAlerts(String severity, LocalDateTime since) {
        List<SecurityAlertResponse> alerts = new ArrayList<>();
        
        LocalDateTime startTime = since != null ? since : LocalDateTime.now().minusDays(7);
        
        // Détection des comptes bloqués
        List<User> lockedUsers = userRepository.findByAccountNonLockedFalse();
        for (User user : lockedUsers) {
            if (user.getLockTime() != null && user.getLockTime().isAfter(startTime)) {
                alerts.add(SecurityAlertResponse.builder()
                        .id((long) alerts.size())
                        .alertType("ACCOUNT_LOCKED")
                        .username(user.getUsername())
                        .failedAttempts(user.getFailedLoginAttempts())
                        .timestamp(user.getLockTime())
                        .severity("MEDIUM")
                        .description("Compte bloqué après " + user.getFailedLoginAttempts() + " tentatives échouées")
                        .build());
            }
        }
        
        // Détection des échecs de connexion récents
        List<AuditLog> failedLogins = auditLogRepository.findByActionAndTimestampAfter(
                "LOGIN_FAILED", startTime);
        
        Map<String, List<AuditLog>> failuresByUser = failedLogins.stream()
                .collect(Collectors.groupingBy(AuditLog::getUsername));
        
        for (Map.Entry<String, List<AuditLog>> entry : failuresByUser.entrySet()) {
            if (entry.getValue().size() >= 3) {
                AuditLog latest = entry.getValue().get(0);
                alerts.add(SecurityAlertResponse.builder()
                        .id((long) alerts.size())
                        .alertType("FAILED_LOGIN")
                        .username(entry.getKey())
                        .ipAddress(latest.getIpAddress())
                        .failedAttempts(entry.getValue().size())
                        .timestamp(latest.getTimestamp())
                        .severity(entry.getValue().size() > 5 ? "HIGH" : "MEDIUM")
                        .description(entry.getValue().size() + " tentatives de connexion échouées")
                        .build());
            }
        }
        
        // Filtrer par sévérité si demandé
        if (severity != null && !severity.isEmpty()) {
            alerts = alerts.stream()
                    .filter(a -> severity.equalsIgnoreCase(a.getSeverity()))
                    .collect(Collectors.toList());
        }
        
        return alerts;
    }

    /**
     * Analyse les connexions suspectes
     */
    public List<AuditLogResponse> getSuspiciousLogins(String ipAddress, 
                                                       LocalDateTime startDate, 
                                                       LocalDateTime endDate) {
        
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();
        
        List<AuditLog> logs;
        
        if (ipAddress != null && !ipAddress.isEmpty()) {
            logs = auditLogRepository.findByIpAddressAndTimestampBetween(ipAddress, start, end);
        } else {
            logs = auditLogRepository.findByActionInAndTimestampBetween(
                    List.of("LOGIN_FAILED", "ACCOUNT_LOCKED"), start, end);
        }
        
        return logs.stream()
                .map(this::mapToAuditLogResponse)
                .collect(Collectors.toList());
    }

    /**
     * Gèle un compte pour investigation
     */
    @Transactional
    public UserResponse freezeAccount(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        
        user.setEnabled(false);
        user.setAccountNonLocked(false);
        user.setLockTime(LocalDateTime.now());
        
        User saved = userRepository.save(user);
        
        auditService.logAction("ACCOUNT_FROZEN", user.getUsername(), 
                "Compte gelé par le responsable sécurité. Raison: " + 
                (reason != null ? reason : "Investigation en cours"), true);
        
        log.info("Compte {} gelé pour investigation", user.getUsername());
        
        return mapToUserResponse(saved);
    }

    /**
     * Dégèle un compte
     */
    @Transactional
    public UserResponse unfreezeAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        
        user.setEnabled(true);
        user.setAccountNonLocked(true);
        user.setFailedLoginAttempts(0);
        user.setLockTime(null);
        
        User saved = userRepository.save(user);
        
        auditService.logAction("ACCOUNT_UNFROZEN", user.getUsername(), 
                "Compte dégelé après investigation", true);
        
        log.info("Compte {} dégelé", user.getUsername());
        
        return mapToUserResponse(saved);
    }

    private AuditLogResponse mapToAuditLogResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .username(log.getUsername())
                .ipAddress(log.getIpAddress())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .enabled(user.getEnabled())
                .accountNonLocked(user.getAccountNonLocked())
                .mustChangePassword(user.getMustChangePassword())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
