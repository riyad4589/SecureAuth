package com.secureauth.services;

import com.secureauth.dto.ChangePasswordRequest;
import com.secureauth.dto.PasswordPolicyResponse;
import com.secureauth.entities.User;
import com.secureauth.exceptions.BadRequestException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    // Password policy configuration
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    private static final int PASSWORD_HISTORY_COUNT = 5;
    private static final int PASSWORD_EXPIRATION_DAYS = 90;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Validate current password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            auditService.logAction("PASSWORD_CHANGE_FAILED", username, "Invalid current password", false);
            throw new BadRequestException("Current password is incorrect");
        }

        // Validate new password matches confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match");
        }

        // Validate password strength
        validatePasswordStrength(request.getNewPassword());

        // Check password history
        if (isPasswordInHistory(user, request.getNewPassword())) {
            throw new BadRequestException("Password has been used recently. Please choose a different password.");
        }

        // Update password
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        updatePasswordHistory(user, user.getPassword());
        user.setPassword(encodedPassword);
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setMustChangePassword(false);
        user.setCredentialsNonExpired(true);

        userRepository.save(user);

        auditService.logAction("PASSWORD_CHANGED", username, "Password changed successfully", true);
        log.info("Password changed successfully for user: {}", username);
    }

    public void validatePasswordStrength(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }

        if (password != null && password.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }

        if (password != null) {
            if (!UPPERCASE_PATTERN.matcher(password).find()) {
                errors.add("Password must contain at least one uppercase letter");
            }

            if (!LOWERCASE_PATTERN.matcher(password).find()) {
                errors.add("Password must contain at least one lowercase letter");
            }

            if (!DIGIT_PATTERN.matcher(password).find()) {
                errors.add("Password must contain at least one digit");
            }

            if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
                errors.add("Password must contain at least one special character (!@#$%^&*()_+-=[]{}etc.)");
            }
        }

        if (!errors.isEmpty()) {
            throw new BadRequestException("Password does not meet requirements: " + String.join(", ", errors));
        }
    }

    private boolean isPasswordInHistory(User user, String newPassword) {
        if (user.getPasswordHistory() == null || user.getPasswordHistory().isEmpty()) {
            return false;
        }

        String[] passwordHashes = user.getPasswordHistory().split(",");
        for (String hash : passwordHashes) {
            if (passwordEncoder.matches(newPassword, hash)) {
                return true;
            }
        }

        return false;
    }

    private void updatePasswordHistory(User user, String currentPasswordHash) {
        List<String> history = new ArrayList<>();
        
        if (user.getPasswordHistory() != null && !user.getPasswordHistory().isEmpty()) {
            history = new ArrayList<>(Arrays.asList(user.getPasswordHistory().split(",")));
        }

        history.add(0, currentPasswordHash);

        if (history.size() > PASSWORD_HISTORY_COUNT) {
            history = history.subList(0, PASSWORD_HISTORY_COUNT);
        }

        user.setPasswordHistory(String.join(",", history));
    }

    public PasswordPolicyResponse getPasswordPolicy() {
        return PasswordPolicyResponse.builder()
                .minLength(MIN_LENGTH)
                .maxLength(MAX_LENGTH)
                .requireUppercase(true)
                .requireLowercase(true)
                .requireNumbers(true)
                .requireSpecialChars(true)
                .passwordExpirationDays(PASSWORD_EXPIRATION_DAYS)
                .passwordHistoryCount(PASSWORD_HISTORY_COUNT)
                .maxLoginAttempts(5)
                .accountLockoutDurationMinutes(30)
                .build();
    }

    @Transactional
    public void checkPasswordExpiration(User user) {
        if (user.getPasswordChangedAt() == null) {
            user.setPasswordChangedAt(user.getCreatedAt());
        }

        LocalDateTime expirationDate = user.getPasswordChangedAt().plusDays(PASSWORD_EXPIRATION_DAYS);
        
        if (LocalDateTime.now().isAfter(expirationDate)) {
            user.setCredentialsNonExpired(false);
            user.setMustChangePassword(true);
            userRepository.save(user);
            log.warn("Password expired for user: {}", user.getUsername());
        }
    }
}
