-- ============================================
-- SecureAuth+ - Script d'initialisation PostgreSQL
-- ============================================

-- Création de la base de données
CREATE DATABASE secureauth
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connexion à la base
\c secureauth;

-- Note: Les tables seront créées automatiquement par Hibernate
-- grâce à la configuration spring.jpa.hibernate.ddl-auto=update

-- Vous pouvez vérifier la création des tables avec :
-- \dt

-- Les tables suivantes seront créées :
-- - users
-- - roles
-- - permissions
-- - user_roles
-- - role_permissions
-- - audit_logs
-- - registration_requests
-- - refresh_tokens

-- Données par défaut créées automatiquement au démarrage :
-- 
-- Permissions :
--   READ_USERS, WRITE_USERS, DELETE_USERS
--   READ_ROLES, WRITE_ROLES, DELETE_ROLES
--   READ_AUDIT, READ_PERMISSIONS, MANAGE_REGISTRATIONS
--
-- Rôles :
--   USER (aucune permission)
--   MANAGER (READ_USERS, WRITE_USERS)
--   SECURITY (READ_AUDIT)
--   ADMIN (toutes les permissions)
--
-- Utilisateur admin :
--   username: admin
--   password: Admin@123 (encodé en BCrypt)
--   email: admin@secureauth.com

-- ============================================
-- Requêtes utiles pour l'administration
-- ============================================

-- Lister tous les utilisateurs
-- SELECT id, username, email, enabled, account_non_locked FROM users;

-- Lister tous les rôles avec le nombre d'utilisateurs
-- SELECT r.name, COUNT(ur.user_id) as user_count
-- FROM roles r
-- LEFT JOIN user_roles ur ON r.id = ur.role_id
-- GROUP BY r.name;

-- Voir les derniers logs d'audit
-- SELECT username, action, success, timestamp 
-- FROM audit_logs 
-- ORDER BY timestamp DESC 
-- LIMIT 10;

-- Compter les demandes d'inscription par statut
-- SELECT status, COUNT(*) 
-- FROM registration_requests 
-- GROUP BY status;

-- ============================================
-- Fin du script
-- ============================================
