package com.secureauth.controllers;

import com.secureauth.dto.ApiResponse;
import com.secureauth.dto.RoleRequest;
import com.secureauth.dto.RoleResponse;
import com.secureauth.services.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller de gestion des rôles
 * Endpoints: CRUD rôles, gestion des permissions
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Role Management", description = "API de gestion des rôles et permissions")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    @Operation(summary = "Récupérer tous les rôles", description = "Liste de tous les rôles disponibles")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> roles = roleService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @Operation(summary = "Récupérer un rôle par ID", description = "Détails d'un rôle spécifique")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long id) {
        RoleResponse role = roleService.getRoleById(id);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @Operation(summary = "Récupérer un rôle par nom", description = "Détails d'un rôle par son nom")
    @GetMapping("/name/{name}")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleByName(@PathVariable String name) {
        RoleResponse role = roleService.getRoleByName(name);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    @Operation(summary = "Créer un rôle", description = "Crée un nouveau rôle avec permissions optionnelles")
    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @Valid @RequestBody RoleRequest request,
            Authentication authentication) {
        
        RoleResponse role = roleService.createRole(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rôle créé avec succès", role));
    }

    @Operation(summary = "Mettre à jour un rôle", description = "Modifie un rôle existant")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request,
            Authentication authentication) {
        
        RoleResponse role = roleService.updateRole(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Rôle mis à jour avec succès", role));
    }

    @Operation(summary = "Supprimer un rôle", description = "Supprime définitivement un rôle")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(
            @PathVariable Long id,
            Authentication authentication) {
        
        roleService.deleteRole(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Rôle supprimé avec succès", null));
    }

    @Operation(summary = "Ajouter une permission à un rôle", description = "Assigne une permission spécifique à un rôle")
    @PostMapping("/{roleId}/permissions/{permissionName}")
    public ResponseEntity<ApiResponse<RoleResponse>> addPermission(
            @PathVariable Long roleId,
            @PathVariable String permissionName,
            Authentication authentication) {
        
        RoleResponse role = roleService.addPermissionToRole(roleId, permissionName, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Permission ajoutée avec succès", role));
    }

    @Operation(summary = "Retirer une permission d'un rôle", description = "Retire une permission d'un rôle")
    @DeleteMapping("/{roleId}/permissions/{permissionName}")
    public ResponseEntity<ApiResponse<RoleResponse>> removePermission(
            @PathVariable Long roleId,
            @PathVariable String permissionName,
            Authentication authentication) {
        
        RoleResponse role = roleService.removePermissionFromRole(roleId, permissionName, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Permission retirée avec succès", role));
    }
}
