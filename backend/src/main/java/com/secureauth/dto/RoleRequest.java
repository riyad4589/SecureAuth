package com.secureauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO pour la création/mise à jour de rôle
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequest {

    @NotBlank(message = "Le nom du rôle est obligatoire")
    @Size(max = 50, message = "Le nom du rôle ne peut pas dépasser 50 caractères")
    private String name;

    @Size(max = 255, message = "La description ne peut pas dépasser 255 caractères")
    private String description;

    private Set<String> permissions;
}
