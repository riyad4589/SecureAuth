package com.secureauth.services;

import com.secureauth.dto.*;
import com.secureauth.entities.AuditLog;
import com.secureauth.entities.Role;
import com.secureauth.entities.User;
import com.secureauth.exceptions.InvalidOperationException;
import com.secureauth.exceptions.ResourceAlreadyExistsException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.RefreshTokenRepository;
import com.secureauth.repositories.RoleRepository;
import com.secureauth.repositories.UserRepository;
import com.secureauth.repositories.UserSessionRepository;
import com.secureauth.repositories.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service de gestion des utilisateurs
 * CRUD complet, activation/désactivation, gestion des rôles
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final ApiKeyRepository apiKeyRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    private static final int PASSWORD_LENGTH = 12;

    /**
     * Récupère tous les utilisateurs avec pagination
     */
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToUserResponse);
    }

    /**
     * Récupère un utilisateur par son ID
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    /**
     * Récupère un utilisateur par son username
     */
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return mapToUserResponse(user);
    }

    /**
     * Crée un nouvel utilisateur (Admin)
     * Génère automatiquement username et mot de passe temporaire
     */
    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request, String adminUsername) {
        // Vérifications
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
        }

        // Génère un username unique basé sur firstName.lastName ou utilise celui fourni
        String username;
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            username = request.getUsername();
            if (userRepository.existsByUsername(username)) {
                throw new ResourceAlreadyExistsException("User", "username", username);
            }
        } else {
            username = generateUsernameFromName(request.getFirstName(), request.getLastName());
        }
        
        // Génère un mot de passe temporaire
        String temporaryPassword = generateTemporaryPassword();

        // Récupère les rôles
        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            roles = request.getRoles().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)))
                    .collect(Collectors.toSet());
        } else {
            // Par défaut, assigne le rôle USER
            Role userRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "USER"));
            roles.add(userRole);
        }

        // Crée l'utilisateur
        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .password(passwordEncoder.encode(temporaryPassword))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
                .mustChangePassword(true)
                .enabled(true)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .build();

        user = userRepository.save(user);

        // Audit
        auditService.logSuccess(adminUsername, AuditLog.Action.USER_CREATED, 
                "Utilisateur créé: " + user.getUsername());

        log.info("User created: {} by admin: {}", user.getUsername(), adminUsername);

        return CreateUserResponse.builder()
                .user(mapToUserResponse(user))
                .temporaryPassword(temporaryPassword)
                .message("Utilisateur créé avec succès. Mot de passe temporaire généré.")
                .build();
    }

    /**
     * Met à jour un utilisateur
     */
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Met à jour les champs si fournis
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
            String action = request.getEnabled() ? AuditLog.Action.USER_ENABLED : AuditLog.Action.USER_DISABLED;
            auditService.logSuccess(adminUsername, action, "Utilisateur: " + user.getUsername());
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = request.getRoles().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
            auditService.logSuccess(adminUsername, AuditLog.Action.ROLE_ASSIGNED, 
                    "Rôles mis à jour pour: " + user.getUsername());
        }

        user = userRepository.save(user);

        auditService.logSuccess(adminUsername, AuditLog.Action.USER_UPDATED, 
                "Utilisateur mis à jour: " + user.getUsername());

        log.info("User updated: {} by admin: {}", user.getUsername(), adminUsername);

        return mapToUserResponse(user);
    }

    /**
     * Supprime un utilisateur
     */
    @Transactional
    public void deleteUser(Long id, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        String username = user.getUsername();
        
        // Supprimer d'abord toutes les données liées à l'utilisateur
        refreshTokenRepository.deleteByUser(user);
        userSessionRepository.deleteByUser(user);
        apiKeyRepository.deleteByUser(user);
        
        // Supprimer l'utilisateur
        userRepository.delete(user);

        auditService.logSuccess(adminUsername, AuditLog.Action.USER_DELETED, 
                "Utilisateur supprimé: " + username);

        log.info("User deleted: {} by admin: {}", username, adminUsername);
    }

    /**
     * Active ou désactive un utilisateur
     */
    @Transactional
    public UserResponse toggleUserStatus(Long id, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setEnabled(!user.getEnabled());
        user = userRepository.save(user);

        String action = user.getEnabled() ? AuditLog.Action.USER_ENABLED : AuditLog.Action.USER_DISABLED;
        auditService.logSuccess(adminUsername, action, "Utilisateur: " + user.getUsername());

        log.info("User status toggled: {} to {} by admin: {}", 
                user.getUsername(), user.getEnabled(), adminUsername);

        return mapToUserResponse(user);
    }

    /**
     * Déverrouille un utilisateur
     */
    @Transactional
    public UserResponse unlockUser(Long id, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getAccountNonLocked()) {
            throw new InvalidOperationException("L'utilisateur n'est pas verrouillé");
        }

        user.unlock();
        user = userRepository.save(user);

        auditService.logSuccess(adminUsername, AuditLog.Action.USER_UNLOCKED, 
                "Utilisateur déverrouillé: " + user.getUsername());

        log.info("User unlocked: {} by admin: {}", user.getUsername(), adminUsername);

        return mapToUserResponse(user);
    }

    /**
     * Change le mot de passe d'un utilisateur
     */
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Vérifie l'ancien mot de passe
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            auditService.logFailure(username, AuditLog.Action.PASSWORD_CHANGED, 
                    "Ancien mot de passe incorrect");
            throw new InvalidOperationException("Ancien mot de passe incorrect");
        }

        // Vérifie la confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("Les mots de passe ne correspondent pas");
        }

        // Met à jour le mot de passe
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditService.logSuccess(username, AuditLog.Action.PASSWORD_CHANGED, 
                "Mot de passe changé avec succès");

        log.info("Password changed for user: {}", username);
    }

    /**
     * Génère un username unique basé sur firstName et lastName
     */
    private String generateUsernameFromName(String firstName, String lastName) {
        String baseUsername = (firstName + "." + lastName).toLowerCase()
                .replaceAll("[^a-z.]", ""); // Supprime les caractères spéciaux
        String username = baseUsername;
        int counter = 2;

        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }

        return username;
    }

    /**
     * Génère un username unique basé sur l'email (pour compatibilité)
     */
    private String generateUsername(String email) {
        String baseUsername = email.split("@")[0].toLowerCase();
        String username = baseUsername;
        int counter = 1;

        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }

        return username;
    }

    /**
     * Génère un mot de passe temporaire sécurisé
     */
    private String generateTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(PASSWORD_LENGTH);

        for (int i = 0; i < PASSWORD_LENGTH; i++) {
            password.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }

        return password.toString();
    }

    /**
     * Met à jour le profil de l'utilisateur connecté
     */
    @Transactional
    public UserResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        user = userRepository.save(user);

        auditService.logSuccess(username, AuditLog.Action.USER_UPDATED, 
                "Profil mis à jour");

        log.info("Profile updated for user: {}", username);

        return mapToUserResponse(user);
    }

    /**
     * Récupère les utilisateurs filtrés (pour Manager)
     */
    public List<UserResponse> getAllUsersFiltered(Boolean active, Boolean locked) {
        List<User> users;

        if (active != null && locked != null) {
            users = userRepository.findByEnabledAndAccountNonLocked(active, locked);
        } else if (active != null) {
            users = userRepository.findByEnabled(active);
        } else if (locked != null) {
            if (locked) {
                users = userRepository.findByAccountNonLocked(true);
            } else {
                users = userRepository.findByAccountNonLockedFalse();
            }
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour les rôles d'un utilisateur (Manager)
     */
    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateUserRolesRequest request, String managerUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        Set<Role> newRoles = request.getRoleIds().stream()
                .map(roleId -> roleRepository.findById(roleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId)))
                .collect(Collectors.toSet());

        user.setRoles(newRoles);
        user = userRepository.save(user);

        auditService.logSuccess(managerUsername, AuditLog.Action.USER_UPDATED, 
                "Rôles mis à jour pour: " + user.getUsername());

        log.info("Roles updated for user: {} by manager: {}", user.getUsername(), managerUsername);

        return mapToUserResponse(user);
    }

    /**
     * Active/Désactive un utilisateur (Manager version avec raison)
     */
    @Transactional
    public UserResponse toggleUserStatus(Long id, ToggleUserStatusRequest request, String managerUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setEnabled(request.getActive());
        user = userRepository.save(user);

        String action = request.getActive() ? AuditLog.Action.USER_ENABLED : AuditLog.Action.USER_DISABLED;
        auditService.logSuccess(managerUsername, action, 
                "Utilisateur: " + user.getUsername() + 
                (request.getReason() != null ? ". Raison: " + request.getReason() : ""));

        log.info("User status toggled: {} to {} by manager: {}", 
                user.getUsername(), request.getActive(), managerUsername);

        return mapToUserResponse(user);
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur (Admin)
     */
    @Transactional
    public ResetPasswordResponse resetUserPassword(Long id, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        String temporaryPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        user = userRepository.save(user);

        auditService.logSuccess(adminUsername, AuditLog.Action.PASSWORD_RESET, 
                "Mot de passe réinitialisé pour: " + user.getUsername());

        log.info("Password reset for user: {} by admin: {}", user.getUsername(), adminUsername);

        return ResetPasswordResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .temporaryPassword(temporaryPassword)
                .message("Mot de passe temporaire généré. L'utilisateur devra le changer à la prochaine connexion.")
                .build();
    }

    /**
     * Mappe User vers UserResponse
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .enabled(user.getEnabled())
                .accountNonLocked(user.getAccountNonLocked())
                .mustChangePassword(user.getMustChangePassword())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
