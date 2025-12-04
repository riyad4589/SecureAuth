package com.secureauth.controllers;

import com.secureauth.dto.*;
import com.secureauth.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller pour les fonctionnalités Manager
 * Gestion des utilisateurs et de leurs rôles
 */
@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Manager Operations", description = "API de gestion pour les managers")
public class ManagerController {

    private final UserService userService;

    @Operation(summary = "Consulter tous les utilisateurs", description = "Liste complète avec filtres")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean locked) {
        
        List<UserResponse> users = userService.getAllUsersFiltered(active, locked);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @Operation(summary = "Modifier les rôles d'un utilisateur", description = "Assigner de nouveaux rôles")
    @PatchMapping("/users/{id}/roles")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request,
            Authentication authentication) {
        
        UserResponse updated = userService.updateUserRoles(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Rôles mis à jour avec succès", updated));
    }

    @Operation(summary = "Activer/Désactiver un compte", description = "Toggle le statut actif d'un utilisateur")
    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody ToggleUserStatusRequest request,
            Authentication authentication) {
        
        UserResponse updated = userService.toggleUserStatus(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Statut modifié avec succès", updated));
    }

    @Operation(summary = "Débloquer un compte", description = "Réinitialise les tentatives de connexion échouées")
    @PostMapping("/users/{id}/unlock")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(
            @PathVariable Long id,
            Authentication authentication) {
        
        UserResponse updated = userService.unlockUser(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Compte débloqué avec succès", updated));
    }
}
