/**
 * Service de cache pour éviter de recharger les mêmes données
 * Utilise un cache en mémoire avec expiration
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes par défaut

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé du cache
   * @returns {any|null} - Valeur ou null si expirée/inexistante
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();

    // Vérifier si le cache a expiré
    if (now - timestamp > CACHE_DURATION) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {any} value - Valeur à stocker
   * @param {number} duration - Durée de vie en ms (optionnel)
   */
  set(key, value, duration = CACHE_DURATION) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    
    // Auto-expiration
    setTimeout(() => {
      this.delete(key);
    }, duration);
  }

  /**
   * Supprime une entrée du cache
   * @param {string} key - Clé à supprimer
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Supprime toutes les entrées commençant par un préfixe
   * @param {string} prefix - Préfixe des clés à supprimer
   */
  invalidateByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  /**
   * Vide tout le cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Vérifie si une clé existe et n'est pas expirée
   * @param {string} key - Clé à vérifier
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }
}

// Instance singleton
const cacheService = new CacheService();

// Clés de cache prédéfinies
export const CACHE_KEYS = {
  USERS: 'users_list',
  ROLES: 'roles_list',
  AUDIT_LOGS: 'audit_logs',
  REGISTRATIONS: 'registrations_list',
  SESSIONS: 'sessions_list',
  API_KEYS: 'api_keys_list',
  DASHBOARD_STATS: 'dashboard_stats',
  TWO_FA_STATUS: '2fa_status',
  PASSWORD_POLICY: 'password_policy',
};

export default cacheService;
