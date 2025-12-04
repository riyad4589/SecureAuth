package com.secureauth.controllers;

import com.secureauth.dto.*;
import com.secureauth.services.AuthenticationService;
import com.secureauth.utils.NetworkUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller d'authentification
 * Endpoints: login, refresh, logout
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API d'authentification JWT")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @Operation(summary = "Connexion utilisateur", description = "Authentifie un utilisateur et retourne un JWT access token et refresh token")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = NetworkUtils.getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        AuthenticationResponse response = authenticationService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Connexion réussie", response));
    }

    @Operation(summary = "Vérifier le code 2FA lors du login", description = "Complète l'authentification en vérifiant le code 2FA")
    @PostMapping("/verify-2fa")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> verify2FA(
            @Valid @RequestBody Verify2FALoginRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = NetworkUtils.getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        AuthenticationResponse response = authenticationService.verify2FALogin(
                request.getTempToken(), 
                request.getCode(),
                ipAddress,
                userAgent
        );
        return ResponseEntity.ok(ApiResponse.success("Authentification 2FA réussie", response));
    }

    @Operation(summary = "Rafraîchir le token", description = "Génère un nouveau access token à partir d'un refresh token valide")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        
        AuthenticationResponse response = authenticationService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token rafraîchi avec succès", response));
    }

    @Operation(summary = "Déconnexion", description = "Révoque tous les refresh tokens de l'utilisateur")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        authenticationService.logout(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie", null));
    }
}
