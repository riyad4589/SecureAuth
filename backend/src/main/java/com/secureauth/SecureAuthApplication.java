package com.secureauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration;

/**
 * SecureAuth+ Application Main Class
 * Plateforme IAM centralisée et sécurisée
 */
@SpringBootApplication(
        exclude = {
                SpringApplicationAdminJmxAutoConfiguration.class
        }
)
public class SecureAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureAuthApplication.class, args);
    }
}
