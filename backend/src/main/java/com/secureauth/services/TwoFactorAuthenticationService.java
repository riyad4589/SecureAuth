package com.secureauth.services;

import com.secureauth.dto.Enable2FARequest;
import com.secureauth.dto.TwoFactorResponse;
import com.secureauth.entities.User;
import com.secureauth.exceptions.BadRequestException;
import com.secureauth.exceptions.ResourceNotFoundException;
import com.secureauth.repositories.UserRepository;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwoFactorAuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    private static final String ISSUER = "SecureAuth+";

    @Transactional
    public TwoFactorResponse enable2FA(String username, Enable2FARequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            auditService.logAction("2FA_ENABLE_FAILED", username, "Invalid password", false);
            throw new BadRequestException("Invalid password");
        }

        if (user.getTwoFactorEnabled()) {
            throw new BadRequestException("2FA is already enabled for this account");
        }

        // Generate secret
        String secret = new DefaultSecretGenerator().generate();
        
        // Generate QR code
        QrData data = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        QrGenerator generator = new ZxingPngQrGenerator();
        String qrCodeUrl;
        
        try {
            byte[] imageData = generator.generate(data);
            qrCodeUrl = getDataUriForImage(imageData, generator.getImageMimeType());
        } catch (QrGenerationException e) {
            log.error("Failed to generate QR code for user: {}", username, e);
            throw new BadRequestException("Failed to generate QR code");
        }

        // Save secret (will be enabled after verification)
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        auditService.logAction("2FA_SETUP_INITIATED", username, "2FA setup initiated", true);

        return TwoFactorResponse.builder()
                .qrCodeUrl(qrCodeUrl)
                .secret(secret)
                .message("Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)")
                .build();
    }

    @Transactional
    public void verify2FA(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (user.getTwoFactorSecret() == null) {
            throw new BadRequestException("2FA is not set up for this account");
        }

        boolean isValid = verifyCode(user.getTwoFactorSecret(), code);

        if (!isValid) {
            auditService.logAction("2FA_VERIFICATION_FAILED", username, 
                    "Invalid verification code", false);
            throw new BadRequestException("Invalid verification code");
        }

        // Enable 2FA
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        auditService.logAction("2FA_ENABLED", username, "2FA enabled successfully", true);
        log.info("2FA enabled for user: {}", username);
    }

    @Transactional
    public void disable2FA(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            auditService.logAction("2FA_DISABLE_FAILED", username, "Invalid password", false);
            throw new BadRequestException("Invalid password");
        }

        if (!user.getTwoFactorEnabled()) {
            throw new BadRequestException("2FA is not enabled for this account");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        auditService.logAction("2FA_DISABLED", username, "2FA disabled", true);
        log.info("2FA disabled for user: {}", username);
    }

    public boolean verifyCode(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        
        return verifier.isValidCode(secret, code);
    }

    public boolean is2FARequired(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            log.debug("User not found for 2FA check: {}", username);
            return false;
        }
        Boolean enabled = user.getTwoFactorEnabled();
        log.debug("2FA status for user {}: twoFactorEnabled={}, twoFactorSecret={}", 
                username, enabled, user.getTwoFactorSecret() != null ? "SET" : "NULL");
        return enabled != null && enabled;
    }
}
