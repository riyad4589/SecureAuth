package com.secureauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO pour la mise à jour d'utilisateur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Email(message = "L'email doit être valide")
    @Size(max = 100, message = "L'email ne peut pas dépasser 100 caractères")
    private String email;

    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    private String firstName;

    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String lastName;

    @Size(max = 20, message = "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    private String phoneNumber;

    private Boolean enabled;
    
    private Set<String> roles;
}
