package com.secureauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la mise à jour du profil utilisateur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    
    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String firstName;
    
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String lastName;
    
    @Email(message = "Format email invalide")
    private String email;
    
    @Size(max = 20, message = "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    private String phoneNumber;
    
    @Size(max = 100, message = "Le département ne peut pas dépasser 100 caractères")
    private String department;
}
