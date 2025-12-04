package com.secureauth.controllers;

import com.secureauth.dto.*;
import com.secureauth.services.ApiKeyService;
import com.secureauth.services.PasswordService;
import com.secureauth.services.SessionManagementService;
import com.secureauth.services.TwoFactorAuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
@Tag(name = "Account Management", description = "User account self-service operations")
public class AccountController {

    private final PasswordService passwordService;
    private final TwoFactorAuthenticationService twoFactorService;
    private final SessionManagementService sessionManagementService;
    private final ApiKeyService apiKeyService;

    @Operation(summary = "Change password", description = "Change user's own password")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        
        passwordService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @Operation(summary = "Get password policy", description = "Get current password policy requirements")
    @GetMapping("/password-policy")
    public ResponseEntity<ApiResponse<PasswordPolicyResponse>> getPasswordPolicy() {
        PasswordPolicyResponse policy = passwordService.getPasswordPolicy();
        return ResponseEntity.ok(ApiResponse.success("Password policy retrieved", policy));
    }

    @Operation(summary = "Enable 2FA", description = "Enable two-factor authentication for user account")
    @PostMapping("/2fa/enable")
    public ResponseEntity<ApiResponse<TwoFactorResponse>> enable2FA(
            @Valid @RequestBody Enable2FARequest request,
            Authentication authentication) {
        
        TwoFactorResponse response = twoFactorService.enable2FA(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("2FA setup initiated. Scan QR code with authenticator app.", response));
    }

    @Operation(summary = "Verify 2FA setup", description = "Verify and complete 2FA setup with code from authenticator app")
    @PostMapping("/2fa/verify")
    public ResponseEntity<ApiResponse<Void>> verify2FA(
            @Valid @RequestBody Verify2FARequest request,
            Authentication authentication) {
        
        twoFactorService.verify2FA(authentication.getName(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("2FA enabled successfully", null));
    }

    @Operation(summary = "Disable 2FA", description = "Disable two-factor authentication")
    @PostMapping("/2fa/disable")
    public ResponseEntity<ApiResponse<Void>> disable2FA(
            @RequestBody Enable2FARequest request,
            Authentication authentication) {
        
        twoFactorService.disable2FA(authentication.getName(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("2FA disabled successfully", null));
    }

    @Operation(summary = "Get 2FA status", description = "Check if 2FA is enabled for current user")
    @GetMapping("/2fa/status")
    public ResponseEntity<ApiResponse<Boolean>> get2FAStatus(Authentication authentication) {
        boolean enabled = twoFactorService.is2FARequired(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("2FA status retrieved", enabled));
    }

    @Operation(summary = "Get active sessions", description = "Get all active sessions for current user")
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getActiveSessions(
            Authentication authentication,
            HttpServletRequest request) {
        
        String currentSessionToken = request.getHeader("X-Session-Token");
        List<SessionResponse> sessions = sessionManagementService.getUserActiveSessions(
                authentication.getName(), currentSessionToken);
        
        return ResponseEntity.ok(ApiResponse.success("Active sessions retrieved", sessions));
    }

    @Operation(summary = "Invalidate session", description = "Invalidate a specific session")
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> invalidateSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        
        sessionManagementService.invalidateSession(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Session invalidated", null));
    }

    @Operation(summary = "Invalidate all sessions", description = "Invalidate all sessions except current")
    @DeleteMapping("/sessions")
    public ResponseEntity<ApiResponse<Void>> invalidateAllSessions(
            Authentication authentication) {
        
        sessionManagementService.invalidateAllUserSessions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("All sessions invalidated", null));
    }

    @Operation(summary = "Create API key", description = "Create a new API key for programmatic access")
    @PostMapping("/api-keys")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> createApiKey(
            @Valid @RequestBody CreateApiKeyRequest request,
            Authentication authentication) {
        
        ApiKeyResponse response = apiKeyService.createApiKey(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("API key created successfully. Store it securely - it won't be shown again.", response));
    }

    @Operation(summary = "Get API keys", description = "Get all API keys for current user")
    @GetMapping("/api-keys")
    public ResponseEntity<ApiResponse<List<ApiKeyResponse>>> getApiKeys(
            Authentication authentication) {
        
        List<ApiKeyResponse> apiKeys = apiKeyService.getUserApiKeys(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("API keys retrieved", apiKeys));
    }

    @Operation(summary = "Revoke API key", description = "Revoke an API key")
    @DeleteMapping("/api-keys/{apiKeyId}")
    public ResponseEntity<ApiResponse<Void>> revokeApiKey(
            @PathVariable Long apiKeyId,
            Authentication authentication) {
        
        apiKeyService.revokeApiKey(authentication.getName(), apiKeyId);
        return ResponseEntity.ok(ApiResponse.success("API key revoked", null));
    }
}
