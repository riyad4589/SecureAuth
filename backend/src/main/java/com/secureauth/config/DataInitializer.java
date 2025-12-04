package com.secureauth.config;

import com.secureauth.entities.Permission;
import com.secureauth.entities.Role;
import com.secureauth.entities.User;
import com.secureauth.repositories.PermissionRepository;
import com.secureauth.repositories.RoleRepository;
import com.secureauth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Initialisation des données par défaut
 * Crée les rôles, permissions et utilisateur admin initial
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Crée les permissions
        createPermissionsIfNotExist();

        // Crée les rôles
        createRolesIfNotExist();

        // Crée l'admin par défaut
        createDefaultAdminIfNotExist();

        log.info("Data initialization completed!");
    }

    private void createPermissionsIfNotExist() {
        String[] permissions = {
            "READ_USERS", "WRITE_USERS", "DELETE_USERS",
            "READ_ROLES", "WRITE_ROLES", "DELETE_ROLES",
            "READ_AUDIT", "READ_PERMISSIONS",
            "MANAGE_REGISTRATIONS"
        };

        for (String permName : permissions) {
            if (!permissionRepository.existsByName(permName)) {
                Permission permission = Permission.builder()
                        .name(permName)
                        .description("Permission: " + permName)
                        .build();
                permissionRepository.save(permission);
                log.info("Created permission: {}", permName);
            }
        }
    }

    private void createRolesIfNotExist() {
        // Rôle USER
        if (!roleRepository.existsByName("USER")) {
            Role userRole = Role.builder()
                    .name("USER")
                    .description("Utilisateur standard")
                    .permissions(new HashSet<>())
                    .active(true)
                    .build();
            roleRepository.save(userRole);
            log.info("Created role: USER");
        }

        // Rôle MANAGER
        if (!roleRepository.existsByName("MANAGER")) {
            Set<Permission> managerPerms = new HashSet<>();
            permissionRepository.findByName("READ_USERS").ifPresent(managerPerms::add);
            permissionRepository.findByName("WRITE_USERS").ifPresent(managerPerms::add);
            
            Role managerRole = Role.builder()
                    .name("MANAGER")
                    .description("Gestionnaire avec droits limités")
                    .permissions(managerPerms)
                    .active(true)
                    .build();
            roleRepository.save(managerRole);
            log.info("Created role: MANAGER");
        }

        // Rôle SECURITY
        if (!roleRepository.existsByName("SECURITY")) {
            Set<Permission> securityPerms = new HashSet<>();
            permissionRepository.findByName("READ_AUDIT").ifPresent(securityPerms::add);
            
            Role securityRole = Role.builder()
                    .name("SECURITY")
                    .description("Auditeur de sécurité")
                    .permissions(securityPerms)
                    .active(true)
                    .build();
            roleRepository.save(securityRole);
            log.info("Created role: SECURITY");
        }

        // Rôle ADMIN
        if (!roleRepository.existsByName("ADMIN")) {
            Set<Permission> adminPerms = permissionRepository.findAll().stream()
                    .collect(HashSet::new, HashSet::add, HashSet::addAll);
            
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Administrateur système avec tous les droits")
                    .permissions(adminPerms)
                    .active(true)
                    .build();
            roleRepository.save(adminRole);
            log.info("Created role: ADMIN");
        }
    }

    private void createDefaultAdminIfNotExist() {
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);

            User admin = User.builder()
                    .username("admin")
                    .email("admin@secureauth.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .firstName("System")
                    .lastName("Administrator")
                    .phoneNumber("+33600000000")
                    .roles(roles)
                    .enabled(true)
                    .accountNonLocked(true)
                    .accountNonExpired(true)
                    .credentialsNonExpired(true)
                    .mustChangePassword(false)
                    .build();

            userRepository.save(admin);
            log.info("Created default admin user - Username: admin, Password: Admin@123");
        }
    }
}
