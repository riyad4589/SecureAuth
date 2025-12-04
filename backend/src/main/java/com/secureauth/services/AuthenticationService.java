package com.secureauth.services;

import com.secureauth.config.JwtService;
import com.secureauth.dto.AuthenticationResponse;
import com.secureauth.dto.LoginRequest;
import com.secureauth.dto.RefreshTokenRequest;
import com.secureauth.dto.UserResponse;
import com.secureauth.entities.AuditLog;
import com.secureauth.entities.RefreshToken;
import com.secureauth.entities.User;
import com.secureauth.exceptions.AuthenticationException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.RefreshTokenRepository;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Service d'authentification
 * Gère le login, logout, refresh token et la sécurité des tentatives de connexion
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final TwoFactorAuthenticationService twoFactorService;
    private final SessionManagementService sessionManagementService;

    @Value("${security.max-login-attempts}")
    private int maxLoginAttempts;

    @Value("${security.account-lock-duration}")
    private long accountLockDuration;

    /**
     * Authentifie un utilisateur et retourne les tokens JWT
     */
    @Transactional(noRollbackFor = {AuthenticationException.class, LockedException.class})
    public AuthenticationResponse login(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    auditService.logFailure(request.getUsername(), AuditLog.Action.LOGIN_FAILED, 
                            "Utilisateur non trouvé");
                    return new AuthenticationException("Identifiants invalides");
                });

        // Vérifie si le compte est verrouillé
        if (!user.isAccountNonLocked()) {
            // Si accountLockDuration > 0, vérifier si le verrouillage peut être auto-levé
            if (accountLockDuration > 0 && user.isLockExpired(accountLockDuration)) {
                user.unlock();
                userRepository.saveAndFlush(user);
                log.info("Account auto-unlocked: {}", user.getUsername());
            } else {
                auditService.logFailure(user.getUsername(), AuditLog.Action.LOGIN_FAILED, 
                        "Compte verrouillé - Contactez un administrateur");
                throw new LockedException("Compte verrouillé suite à trop de tentatives échouées. Contactez un administrateur pour le déverrouiller.");
            }
        }

        // Vérification du mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Vérifier si l'utilisateur est ADMIN - pas de limite de tentatives pour les admins
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ADMIN"));
            
            if (isAdmin) {
                // Pour les admins : log l'échec mais pas de verrouillage
                auditService.logFailure(user.getUsername(), AuditLog.Action.LOGIN_FAILED, 
                        "Mot de passe incorrect (Admin - sans limite)");
                log.warn("Failed login attempt for admin user: {}", user.getUsername());
                throw new AuthenticationException("Mot de passe incorrect.");
            }
            
            // Pour les non-admins : incrémenter les tentatives
            user.incrementFailedAttempts();
            int remainingAttempts = maxLoginAttempts - user.getFailedLoginAttempts();
            
            log.warn("Failed login attempt {}/{} for user: {}", 
                    user.getFailedLoginAttempts(), maxLoginAttempts, user.getUsername());
            
            if (user.getFailedLoginAttempts() >= maxLoginAttempts) {
                user.lock();
                userRepository.saveAndFlush(user);
                auditService.logFailure(user.getUsername(), AuditLog.Action.USER_LOCKED, 
                        "Compte verrouillé après " + maxLoginAttempts + " tentatives échouées");
                log.warn("Account locked due to {} failed attempts: {}", maxLoginAttempts, user.getUsername());
                throw new AuthenticationException("Compte verrouillé suite à trop de tentatives échouées. Contactez un administrateur.");
            } else {
                userRepository.saveAndFlush(user);
                auditService.logFailure(user.getUsername(), AuditLog.Action.LOGIN_FAILED, 
                        "Mot de passe incorrect - Tentative " + user.getFailedLoginAttempts() + "/" + maxLoginAttempts);
                
                // Message amélioré avec le nombre de tentatives restantes
                String attemptMessage = remainingAttempts == 1 
                        ? "⚠️ Attention : dernière tentative avant verrouillage du compte !"
                        : "Mot de passe incorrect. Il vous reste " + remainingAttempts + " tentative(s) avant le verrouillage de votre compte.";
                throw new AuthenticationException(attemptMessage);
            }
        }

        // Mot de passe correct - réinitialiser les tentatives échouées
        user.resetFailedAttempts();
        userRepository.save(user);

            // Si l'utilisateur a la 2FA activée, on demande le code
            if (user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled()) {
                // Génère un token temporaire (valide 5 minutes)
                String tempToken = jwtService.generateTempToken(user);
                
                auditService.logSuccess(user.getUsername(), AuditLog.Action.LOGIN_SUCCESS, 
                        "Authentification réussie, 2FA requise");
                
                return AuthenticationResponse.builder()
                        .requires2FA(true)
                        .tempToken(tempToken)
                        .tokenType("Bearer")
                        .build();
            }

            // Si pas de 2FA, login normal
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // Génère les tokens
            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            // Sauvegarde le refresh token
            saveRefreshToken(user, refreshToken);
            
            // Crée une session utilisateur
            var session = sessionManagementService.createSession(user, ipAddress, userAgent);

            // Audit
            auditService.logSuccess(user.getUsername(), AuditLog.Action.LOGIN_SUCCESS, 
                    "Connexion réussie depuis " + ipAddress);

            return AuthenticationResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(3600L) // 1 heure
                    .user(mapToUserResponse(user))
                    .requires2FA(false)
                    .sessionToken(session.getSessionToken())
                    .build();
    }

    /**
     * Vérifie le code 2FA et complète l'authentification
     */
    @Transactional
    public AuthenticationResponse verify2FALogin(String tempToken, String code, String ipAddress, String userAgent) {
        // Extrait le username du token temporaire
        String username = jwtService.extractUsername(tempToken);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("Token invalide"));

        // Vérifie le code 2FA
        boolean isValid = twoFactorService.verifyCode(user.getTwoFactorSecret(), code);
        
        if (!isValid) {
            auditService.logFailure(username, AuditLog.Action.LOGIN_FAILED, 
                    "Code 2FA invalide");
            throw new AuthenticationException("Code 2FA invalide");
        }

        // Code valide, génère les tokens JWT
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        saveRefreshToken(user, refreshToken);
        
        // Crée une session utilisateur
        var session = sessionManagementService.createSession(user, ipAddress, userAgent);

        auditService.logSuccess(username, AuditLog.Action.LOGIN_SUCCESS, 
                "Connexion réussie avec 2FA");

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(mapToUserResponse(user))
                .requires2FA(false)
                .sessionToken(session.getSessionToken())
                .build();
    }

    /**
     * Rafraîchit l'access token avec un refresh token
     */
    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthenticationException("Refresh token invalide"));

        // Vérifie si le token est révoqué ou expiré
        if (refreshToken.getRevoked()) {
            throw new AuthenticationException("Refresh token révoqué");
        }

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new AuthenticationException("Refresh token expiré");
        }

        User user = refreshToken.getUser();

        // Génère un nouveau access token
        String newAccessToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(request.getRefreshToken())
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Déconnecte un utilisateur (révoque le refresh token)
     */
    @Transactional
    public void logout(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Révoque tous les refresh tokens de l'utilisateur
        refreshTokenRepository.findByUser(user).forEach(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
        });

        auditService.logSuccess(username, AuditLog.Action.LOGOUT, "Déconnexion réussie");
    }

    /**
     * Sauvegarde un refresh token
     */
    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusNanos(jwtService.getRefreshExpiration() * 1_000_000))
                .build();

        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Mappe User vers UserResponse
     */
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
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
