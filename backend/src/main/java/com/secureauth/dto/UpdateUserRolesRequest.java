package com.secureauth.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO pour mettre à jour les rôles d'un utilisateur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRolesRequest {
    
    @NotEmpty(message = "Au moins un rôle doit être assigné")
    private Set<Long> roleIds;
}
