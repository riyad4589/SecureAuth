package com.secureauth.services;

import com.secureauth.dto.RoleRequest;
import com.secureauth.dto.RoleResponse;
import com.secureauth.entities.AuditLog;
import com.secureauth.entities.Permission;
import com.secureauth.entities.Role;
import com.secureauth.exceptions.ResourceAlreadyExistsException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.PermissionRepository;
import com.secureauth.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service de gestion des rôles
 * CRUD complet, gestion des permissions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final AuditService auditService;

    /**
     * Récupère tous les rôles
     */
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToRoleResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un rôle par son ID
     */
    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return mapToRoleResponse(role);
    }

    /**
     * Récupère un rôle par son nom
     */
    public RoleResponse getRoleByName(String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", name));
        return mapToRoleResponse(role);
    }

    /**
     * Crée un nouveau rôle
     */
    @Transactional
    public RoleResponse createRole(RoleRequest request, String adminUsername) {
        // Vérifie si le rôle existe déjà
        if (roleRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Role", "name", request.getName());
        }

        // Récupère les permissions
        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            permissions = request.getPermissions().stream()
                    .map(permissionName -> permissionRepository.findByName(permissionName)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission", "name", permissionName)))
                    .collect(Collectors.toSet());
        }

        // Crée le rôle
        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .permissions(permissions)
                .active(true)
                .build();

        role = roleRepository.save(role);

        auditService.logSuccess(adminUsername, AuditLog.Action.ROLE_CREATED, 
                "Rôle créé: " + role.getName());

        log.info("Role created: {} by admin: {}", role.getName(), adminUsername);

        return mapToRoleResponse(role);
    }

    /**
     * Met à jour un rôle
     */
    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request, String adminUsername) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        // Met à jour le nom si fourni et différent
        if (request.getName() != null && !request.getName().equals(role.getName())) {
            if (roleRepository.existsByName(request.getName())) {
                throw new ResourceAlreadyExistsException("Role", "name", request.getName());
            }
            role.setName(request.getName());
        }

        // Met à jour la description
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        // Met à jour les permissions
        if (request.getPermissions() != null) {
            Set<Permission> permissions = request.getPermissions().stream()
                    .map(permissionName -> permissionRepository.findByName(permissionName)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission", "name", permissionName)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }

        role = roleRepository.save(role);

        auditService.logSuccess(adminUsername, AuditLog.Action.ROLE_UPDATED, 
                "Rôle mis à jour: " + role.getName());

        log.info("Role updated: {} by admin: {}", role.getName(), adminUsername);

        return mapToRoleResponse(role);
    }

    /**
     * Supprime un rôle
     */
    @Transactional
    public void deleteRole(Long id, String adminUsername) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        String roleName = role.getName();
        roleRepository.delete(role);

        auditService.logSuccess(adminUsername, AuditLog.Action.ROLE_DELETED, 
                "Rôle supprimé: " + roleName);

        log.info("Role deleted: {} by admin: {}", roleName, adminUsername);
    }

    /**
     * Ajoute une permission à un rôle
     */
    @Transactional
    public RoleResponse addPermissionToRole(Long roleId, String permissionName, String adminUsername) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Permission permission = permissionRepository.findByName(permissionName)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "name", permissionName));

        role.addPermission(permission);
        role = roleRepository.save(role);

        auditService.logSuccess(adminUsername, AuditLog.Action.PERMISSION_ASSIGNED, 
                "Permission " + permissionName + " ajoutée au rôle: " + role.getName());

        log.info("Permission {} added to role: {} by admin: {}", 
                permissionName, role.getName(), adminUsername);

        return mapToRoleResponse(role);
    }

    /**
     * Retire une permission d'un rôle
     */
    @Transactional
    public RoleResponse removePermissionFromRole(Long roleId, String permissionName, String adminUsername) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Permission permission = permissionRepository.findByName(permissionName)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "name", permissionName));

        role.removePermission(permission);
        role = roleRepository.save(role);

        auditService.logSuccess(adminUsername, AuditLog.Action.PERMISSION_REMOVED, 
                "Permission " + permissionName + " retirée du rôle: " + role.getName());

        log.info("Permission {} removed from role: {} by admin: {}", 
                permissionName, role.getName(), adminUsername);

        return mapToRoleResponse(role);
    }

    /**
     * Mappe Role vers RoleResponse
     */
    private RoleResponse mapToRoleResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getPermissions().stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet()))
                .active(role.getActive())
                .createdAt(role.getCreatedAt())
                .build();
    }
}
