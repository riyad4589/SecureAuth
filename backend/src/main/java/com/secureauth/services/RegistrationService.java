package com.secureauth.services;

import com.secureauth.dto.CreateUserResponse;
import com.secureauth.dto.RegistrationRequestDto;
import com.secureauth.dto.RegistrationRequestResponse;
import com.secureauth.dto.UserResponse;
import com.secureauth.entities.AuditLog;
import com.secureauth.entities.RegistrationRequest;
import com.secureauth.entities.Role;
import com.secureauth.entities.User;
import com.secureauth.exceptions.InvalidOperationException;
import com.secureauth.exceptions.ResourceAlreadyExistsException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.RegistrationRequestRepository;
import com.secureauth.repositories.RoleRepository;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service de gestion des demandes d'inscription
 * Soumission, approbation, rejet
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationService {

    private final RegistrationRequestRepository registrationRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final EmailService emailService;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    private static final int PASSWORD_LENGTH = 12;

    /**
     * Soumet une nouvelle demande d'inscription
     */
    @Transactional
    public RegistrationRequestResponse submitRequest(RegistrationRequestDto dto) {
        // Vérifie si l'email existe déjà
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ResourceAlreadyExistsException("Un utilisateur existe déjà avec cet email");
        }

        // Vérifie si une demande existe déjà pour cet email
        if (registrationRequestRepository.existsByEmail(dto.getEmail())) {
            throw new ResourceAlreadyExistsException("Une demande d'inscription existe déjà pour cet email");
        }

        RegistrationRequest request = RegistrationRequest.builder()
                .email(dto.getEmail())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .phoneNumber(dto.getPhoneNumber())
                .companyName(dto.getCompanyName())
                .requestReason(dto.getRequestReason())
                .status(RegistrationRequest.RequestStatus.PENDING)
                .build();

        request = registrationRequestRepository.save(request);

        log.info("Registration request submitted: {}", dto.getEmail());

        return mapToResponse(request);
    }

    /**
     * Récupère toutes les demandes en attente
     */
    public List<RegistrationRequestResponse> getPendingRequests() {
        return registrationRequestRepository
                .findByStatusOrderByRequestedAtAsc(RegistrationRequest.RequestStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les demandes
     */
    public List<RegistrationRequestResponse> getAllRequests() {
        return registrationRequestRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une demande par ID
     */
    public RegistrationRequestResponse getRequestById(Long id) {
        RegistrationRequest request = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationRequest", "id", id));
        return mapToResponse(request);
    }

    /**
     * Approuve une demande d'inscription et crée l'utilisateur
     */
    @Transactional
    public CreateUserResponse approveRequest(Long id, String adminUsername, String adminComment) {
        RegistrationRequest request = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationRequest", "id", id));

        if (request.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            throw new InvalidOperationException("Cette demande a déjà été traitée");
        }

        // Vérifie à nouveau que l'email n'existe pas
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Un utilisateur existe déjà avec cet email");
        }

        // Génère username et mot de passe
        String username = generateUsername(request.getEmail());
        String temporaryPassword = generateTemporaryPassword();

        // Récupère le rôle USER par défaut
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "USER"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

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

        // Met à jour la demande
        request.setStatus(RegistrationRequest.RequestStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUsername);
        request.setAdminComment(adminComment);
        registrationRequestRepository.save(request);

        // Envoi de l'email de bienvenue avec les identifiants
        try {
            emailService.sendWelcomeEmail(
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    username,
                    temporaryPassword
            );
            log.info("Welcome email sent to: {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {} - Error: {}", request.getEmail(), e.getMessage());
            // On ne fait pas échouer l'approbation si l'email échoue
        }

        // Audit
        auditService.logSuccess(adminUsername, AuditLog.Action.REGISTRATION_APPROVED, 
                "Demande approuvée pour: " + request.getEmail());

        log.info("Registration request approved: {} by admin: {}", request.getEmail(), adminUsername);

        return CreateUserResponse.builder()
                .user(mapToUserResponse(user))
                .temporaryPassword(temporaryPassword)
                .message("Demande d'inscription approuvée. Utilisateur créé avec succès. Email envoyé.")
                .build();
    }

    /**
     * Rejette une demande d'inscription
     */
    @Transactional
    public RegistrationRequestResponse rejectRequest(Long id, String adminUsername, String adminComment) {
        RegistrationRequest request = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationRequest", "id", id));

        if (request.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            throw new InvalidOperationException("Cette demande a déjà été traitée");
        }

        request.setStatus(RegistrationRequest.RequestStatus.REJECTED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUsername);
        request.setAdminComment(adminComment);
        request = registrationRequestRepository.save(request);

        // Envoi de l'email de notification de rejet
        try {
            emailService.sendRejectionEmail(
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    adminComment
            );
            log.info("Rejection email sent to: {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send rejection email to: {} - Error: {}", request.getEmail(), e.getMessage());
            // On ne fait pas échouer le rejet si l'email échoue
        }

        // Audit
        auditService.logSuccess(adminUsername, AuditLog.Action.REGISTRATION_REJECTED, 
                "Demande rejetée pour: " + request.getEmail());

        log.info("Registration request rejected: {} by admin: {}", request.getEmail(), adminUsername);

        return mapToResponse(request);
    }

    /**
     * Génère un username unique basé sur l'email
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
     * Mappe RegistrationRequest vers RegistrationRequestResponse
     */
    private RegistrationRequestResponse mapToResponse(RegistrationRequest request) {
        return RegistrationRequestResponse.builder()
                .id(request.getId())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .companyName(request.getCompanyName())
                .requestReason(request.getRequestReason())
                .status(request.getStatus().name())
                .requestedAt(request.getRequestedAt())
                .processedAt(request.getProcessedAt())
                .processedBy(request.getProcessedBy())
                .adminComment(request.getAdminComment())
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
