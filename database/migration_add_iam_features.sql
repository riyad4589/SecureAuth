-- ============================================
-- SecureAuth+ - Migration: Ajout des fonctionnalités IAM
-- Date: 2025-12-03
-- Description: Ajoute les colonnes pour 2FA, gestion de mots de passe,
--              sessions et API keys
-- ============================================

\c secureauth;

-- ============================================
-- 1. Mise à jour de la table users
-- ============================================

-- Ajout des colonnes pour 2FA/MFA
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Ajout des colonnes pour gestion de mots de passe
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_history TEXT;

-- ============================================
-- 2. Création de la table user_sessions
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(active);

-- ============================================
-- 3. Création de la table api_keys
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked);

-- ============================================
-- 4. Mise à jour des données existantes
-- ============================================

-- Initialiser les nouvelles colonnes pour les utilisateurs existants
UPDATE users SET two_factor_enabled = false WHERE two_factor_enabled IS NULL;
UPDATE users SET password_changed_at = created_at WHERE password_changed_at IS NULL;

-- ============================================
-- 5. Vérification
-- ============================================

-- Afficher la structure de la table users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Afficher les nouvelles tables
\dt user_sessions
\dt api_keys

-- ============================================
-- Fin de la migration
-- ============================================
