package com.secureauth.services;

import com.secureauth.dto.SessionResponse;
import com.secureauth.entities.User;
import com.secureauth.entities.UserSession;
import com.secureauth.exceptions.BadRequestException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.UserRepository;
import com.secureauth.repositories.UserSessionRepository;
import com.secureauth.utils.NetworkUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionManagementService {

    private final UserSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    private static final int MAX_CONCURRENT_SESSIONS = 3;
    private static final int SESSION_DURATION_HOURS = 24;

    @Transactional
    public UserSession createSession(User user, String ipAddress, String userAgent) {
        // Check concurrent sessions limit
        long activeSessions = sessionRepository.countByUserIdAndActiveTrue(user.getId());
        
        if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
            // Invalidate oldest session
            List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(user.getId());
            sessions.stream()
                    .min((s1, s2) -> s1.getLoginTime().compareTo(s2.getLoginTime()))
                    .ifPresent(oldestSession -> {
                        oldestSession.invalidate();
                        sessionRepository.save(oldestSession);
                        log.info("Invalidated oldest session for user: {} due to concurrent session limit", user.getUsername());
                    });
        }

        UserSession session = UserSession.builder()
                .user(user)
                .sessionToken(UUID.randomUUID().toString())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .loginTime(LocalDateTime.now())
                .lastActivity(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(SESSION_DURATION_HOURS))
                .active(true)
                .build();

        UserSession saved = sessionRepository.save(session);
        
        auditService.logAction("SESSION_CREATED", user.getUsername(), 
                "New session from IP: " + ipAddress, true);
        
        return saved;
    }

    @Transactional
    public void updateSessionActivity(String sessionToken) {
        sessionRepository.findBySessionToken(sessionToken)
                .ifPresent(session -> {
                    session.updateActivity();
                    sessionRepository.save(session);
                });
    }

    @Transactional
    public void invalidateSession(Long sessionId, String username) {
        UserSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only invalidate your own sessions");
        }

        session.invalidate();
        sessionRepository.save(session);

        auditService.logAction("SESSION_INVALIDATED", username, 
                "Session ID: " + sessionId, true);
        
        log.info("Session invalidated: {} for user: {}", sessionId, username);
    }

    @Transactional
    public void invalidateAllUserSessions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(user.getId());
        
        sessions.forEach(session -> {
            session.invalidate();
            sessionRepository.save(session);
        });

        auditService.logAction("ALL_SESSIONS_INVALIDATED", username, 
                sessions.size() + " sessions invalidated", true);
        
        log.info("All sessions invalidated for user: {}, count: {}", username, sessions.size());
    }

    public List<SessionResponse> getUserActiveSessions(String username, String currentSessionToken) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<UserSession> sessions = sessionRepository.findByUserIdAndActiveTrue(user.getId());
        
        log.debug("Found {} active sessions for user: {}", sessions.size(), username);

        return sessions.stream()
                .map(session -> SessionResponse.builder()
                        .id(session.getId())
                        .username(user.getUsername())
                        .ipAddress(session.getIpAddress())
                        .userAgent(NetworkUtils.parseUserAgent(session.getUserAgent()))
                        .loginTime(session.getLoginTime())
                        .lastActivity(session.getLastActivity())
                        .active(session.getActive())
                        .currentSession(currentSessionToken != null && session.getSessionToken().equals(currentSessionToken))
                        .build())
                .collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void cleanupExpiredSessions() {
        List<UserSession> expiredSessions = sessionRepository
                .findByExpiresAtBeforeAndActiveTrue(LocalDateTime.now());

        expiredSessions.forEach(session -> {
            session.invalidate();
            sessionRepository.save(session);
        });

        if (!expiredSessions.isEmpty()) {
            log.info("Cleaned up {} expired sessions", expiredSessions.size());
        }
    }
}
