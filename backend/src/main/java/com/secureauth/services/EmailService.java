package com.secureauth.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.name}")
    private String appName;

    @Value("${app.url}")
    private String appUrl;

    /**
     * Envoie un email de bienvenue avec les informations de connexion
     */
    @Async
    public void sendWelcomeEmail(String toEmail, String firstName, String lastName, 
                                  String username, String temporaryPassword) {
        try {
            Context context = new Context();
            context.setVariable("firstName", firstName);
            context.setVariable("lastName", lastName);
            context.setVariable("username", username);
            context.setVariable("email", toEmail);
            context.setVariable("temporaryPassword", temporaryPassword);
            context.setVariable("loginUrl", appUrl + "/login");
            context.setVariable("appName", appName);
            context.setVariable("year", java.time.Year.now().getValue());

            String htmlContent = templateEngine.process("welcome-email", context);

            sendHtmlEmail(toEmail, "Bienvenue sur " + appName + " - Vos informations de connexion", htmlContent);
            
            log.info("Email de bienvenue envoyé à: {}", toEmail);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de bienvenue à {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Envoie un email de notification de rejet
     */
    @Async
    public void sendRejectionEmail(String toEmail, String firstName, String lastName, 
                                    String reason) {
        try {
            Context context = new Context();
            context.setVariable("firstName", firstName);
            context.setVariable("lastName", lastName);
            context.setVariable("reason", reason);
            context.setVariable("appName", appName);
            context.setVariable("year", java.time.Year.now().getValue());

            String htmlContent = templateEngine.process("rejection-email", context);

            sendHtmlEmail(toEmail, appName + " - Demande d'inscription non approuvée", htmlContent);
            
            log.info("Email de rejet envoyé à: {}", toEmail);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet à {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetToken) {
        try {
            Context context = new Context();
            context.setVariable("firstName", firstName);
            context.setVariable("resetLink", appUrl + "/reset-password?token=" + resetToken);
            context.setVariable("appName", appName);
            context.setVariable("year", java.time.Year.now().getValue());

            String htmlContent = templateEngine.process("password-reset-email", context);

            sendHtmlEmail(toEmail, appName + " - Réinitialisation de mot de passe", htmlContent);
            
            log.info("Email de réinitialisation envoyé à: {}", toEmail);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de réinitialisation à {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Envoie un email HTML générique
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
