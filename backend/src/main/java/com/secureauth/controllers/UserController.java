package com.secureauth.controllers;

import com.secureauth.dto.*;
import com.secureauth.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller de gestion des utilisateurs
 * Endpoints: CRUD utilisateurs, activation/désactivation, déverrouillage
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "API de gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Récupérer tous les utilisateurs", description = "Liste paginée de tous les utilisateurs (ADMIN ou MANAGER)")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @Operation(summary = "Récupérer un utilisateur par ID", description = "Détails d'un utilisateur spécifique")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @Operation(summary = "Récupérer le profil actuel", description = "Informations de l'utilisateur connecté")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        UserResponse user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @Operation(summary = "Créer un utilisateur", description = "Crée un nouvel utilisateur avec génération automatique de credentials (ADMIN uniquement)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CreateUserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication) {
        
        CreateUserResponse response = userService.createUser(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Utilisateur créé avec succès", response));
    }

    @Operation(summary = "Mettre à jour un utilisateur", description = "Modifie les informations d'un utilisateur (ADMIN uniquement)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        
        UserResponse user = userService.updateUser(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Utilisateur mis à jour avec succès", user));
    }

    @Operation(summary = "Supprimer un utilisateur", description = "Supprime définitivement un utilisateur (ADMIN uniquement)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            Authentication authentication) {
        
        userService.deleteUser(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Utilisateur supprimé avec succès", null));
    }

    @Operation(summary = "Activer/Désactiver un utilisateur", description = "Change le statut actif/inactif (ADMIN uniquement)")
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable Long id,
            Authentication authentication) {
        
        UserResponse user = userService.toggleUserStatus(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Statut utilisateur modifié avec succès", user));
    }

    @Operation(summary = "Déverrouiller un utilisateur", description = "Déverrouille un compte bloqué (ADMIN uniquement)")
    @PatchMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(
            @PathVariable Long id,
            Authentication authentication) {
        
        UserResponse user = userService.unlockUser(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Utilisateur déverrouillé avec succès", user));
    }

    @Operation(summary = "Changer son mot de passe", description = "Permet à l'utilisateur connecté de changer son mot de passe")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe modifié avec succès", null));
    }

    @Operation(summary = "Réinitialiser le mot de passe", description = "Génère un nouveau mot de passe temporaire (ADMIN uniquement)")
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetUserPassword(
            @PathVariable Long id,
            Authentication authentication) {
        
        ResetPasswordResponse response = userService.resetUserPassword(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès", response));
    }
}
