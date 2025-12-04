package com.secureauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la vérification du code 2FA lors du login
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Verify2FALoginRequest {

    @NotBlank(message = "Le token temporaire est requis")
    private String tempToken;

    @NotBlank(message = "Le code 2FA est requis")
    @Pattern(regexp = "\\d{6}", message = "Le code doit contenir 6 chiffres")
    private String code;
}
