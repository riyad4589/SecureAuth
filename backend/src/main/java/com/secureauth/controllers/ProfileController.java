package com.secureauth.controllers;

import com.secureauth.dto.ApiResponse;
import com.secureauth.dto.ChangePasswordRequest;
import com.secureauth.dto.ProfileUpdateRequest;
import com.secureauth.dto.UserResponse;
import com.secureauth.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pour la gestion du profil utilisateur
 * Accessible par tous les utilisateurs authentifiés
 */
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Profile Management", description = "API de gestion du profil utilisateur")
public class ProfileController {

    private final UserService userService;

    @Operation(summary = "Obtenir mon profil", description = "Récupère les informations du profil de l'utilisateur connecté")
    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(Authentication authentication) {
        UserResponse profile = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @Operation(summary = "Mettre à jour mon profil", description = "Modifie les informations personnelles")
    @PutMapping
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        
        UserResponse updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profil mis à jour avec succès", updated));
    }

    @Operation(summary = "Changer mon mot de passe", description = "Permet de changer son propre mot de passe")
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changeMyPassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe modifié avec succès", null));
    }
}
