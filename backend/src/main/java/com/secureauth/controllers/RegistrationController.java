package com.secureauth.controllers;

import com.secureauth.dto.ApiResponse;
import com.secureauth.dto.CreateUserResponse;
import com.secureauth.dto.RegistrationRequestDto;
import com.secureauth.dto.RegistrationRequestResponse;
import com.secureauth.services.RegistrationService;
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
 * Controller de gestion des demandes d'inscription
 * Endpoints: soumission, approbation, rejet
 */
@RestController
@RequestMapping("/api/v1/registration")
@RequiredArgsConstructor
@Tag(name = "Registration Management", description = "API de gestion des demandes d'inscription")
public class RegistrationController {

    private final RegistrationService registrationService;

    @Operation(summary = "Soumettre une demande d'inscription", description = "Permet à un visiteur de soumettre une demande")
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> submitRequest(
            @Valid @RequestBody RegistrationRequestDto request) {
        
        RegistrationRequestResponse response = registrationService.submitRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Demande d'inscription soumise avec succès", response));
    }

    @Operation(summary = "Récupérer les demandes en attente", description = "Liste des demandes non traitées (ADMIN)")
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<RegistrationRequestResponse>>> getPendingRequests() {
        List<RegistrationRequestResponse> requests = registrationService.getPendingRequests();
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @Operation(summary = "Récupérer toutes les demandes", description = "Liste complète des demandes (ADMIN)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<RegistrationRequestResponse>>> getAllRequests() {
        List<RegistrationRequestResponse> requests = registrationService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @Operation(summary = "Récupérer une demande par ID", description = "Détails d'une demande spécifique (ADMIN)")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> getRequestById(@PathVariable Long id) {
        RegistrationRequestResponse request = registrationService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success(request));
    }

    @Operation(summary = "Approuver une demande", description = "Crée l'utilisateur et génère les credentials (ADMIN)")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CreateUserResponse>> approveRequest(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            Authentication authentication) {
        
        CreateUserResponse response = registrationService.approveRequest(
                id, authentication.getName(), comment);
        return ResponseEntity.ok(ApiResponse.success("Demande approuvée avec succès", response));
    }

    @Operation(summary = "Rejeter une demande", description = "Rejette une demande d'inscription (ADMIN)")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> rejectRequest(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            Authentication authentication) {
        
        RegistrationRequestResponse response = registrationService.rejectRequest(
                id, authentication.getName(), comment);
        return ResponseEntity.ok(ApiResponse.success("Demande rejetée", response));
    }
}
