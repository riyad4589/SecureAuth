import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import usePageTitle from '../hooks/usePageTitle';
import lightLogo from '../images/light_theme.png';
import darkLogo from '../images/dark_theme.png';

// Icons
const Icons = {
  Lock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Check: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Warning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Mail: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
};

function ForceChangePassword({ setMustChangePassword }) {
  usePageTitle('Changer le mot de passe');
  const navigate = useNavigate();
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordPolicy, setPasswordPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    loadPasswordPolicy();
    
    // Écouter les changements de thème
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const loadPasswordPolicy = async () => {
    try {
      const response = await authAPI.get('/account/password-policy');
      setPasswordPolicy(response.data.data);
    } catch (err) {
      console.error('Failed to load password policy:', err);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthInfo = (password) => {
    const strength = calculatePasswordStrength(password);
    if (strength < 30) return { label: 'Faible', color: 'var(--color-danger)' };
    if (strength < 60) return { label: 'Moyen', color: 'var(--color-warning)' };
    if (strength < 80) return { label: 'Bon', color: 'var(--color-info)' };
    return { label: 'Excellent', color: 'var(--color-success)' };
  };

  const checkRequirement = (password, requirement) => {
    switch (requirement) {
      case 'length': return password.length >= (passwordPolicy?.minLength || 8);
      case 'uppercase': return /[A-Z]/.test(password);
      case 'lowercase': return /[a-z]/.test(password);
      case 'number': return /\d/.test(password);
      case 'special': return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      default: return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas', {
        title: 'Erreur de validation',
        icon: 'error'
      });
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'ancien', {
        title: 'Erreur de validation',
        icon: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      await authAPI.post('/account/change-password', passwordData);
      toast.success('Vous allez être redirigé vers le tableau de bord', {
        title: '🎉 Mot de passe changé avec succès !',
        icon: 'password',
        duration: 3000
      });
      
      const user = authService.getUser();
      if (user) {
        user.mustChangePassword = false;
        authService.setUser(user);
      }

      if (setMustChangePassword) {
        setMustChangePassword(false);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Échec du changement de mot de passe', {
        title: 'Erreur',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const allRequirementsMet = () => {
    const password = passwordData.newPassword;
    return checkRequirement(password, 'length') &&
           checkRequirement(password, 'uppercase') &&
           checkRequirement(password, 'lowercase') &&
           checkRequirement(password, 'number') &&
           checkRequirement(password, 'special');
  };

  const isFormValid = () => {
    return passwordData.oldPassword &&
           passwordData.newPassword &&
           passwordData.confirmPassword &&
           passwordData.newPassword === passwordData.confirmPassword &&
           allRequirementsMet();
  };

  return (
    <div className="auth-page">
      {/* Panneau gauche - Branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-branding-logo">
            <img 
              src={theme === 'dark' ? darkLogo : lightLogo} 
              alt="SecureAuth+" 
            />
          </div>
          
          <div className="auth-branding-text">
            <h1>Sécurisez votre compte</h1>
            <p>Pour des raisons de sécurité, vous devez créer un nouveau mot de passe personnel lors de votre première connexion.</p>
          </div>
          
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                <Icons.Lock />
              </div>
              <div className="auth-feature-text">
                <h3>Mot de passe temporaire</h3>
                <p>Utilisez le mot de passe reçu par email</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                <Icons.Shield />
              </div>
              <div className="auth-feature-text">
                <h3>Nouveau mot de passe</h3>
                <p>Créez un mot de passe fort et unique</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                <Icons.Check />
              </div>
              <div className="auth-feature-text">
                <h3>Compte sécurisé</h3>
                <p>Accédez à toutes les fonctionnalités</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-branding-footer">
          <p>© 2024 SecureAuth+. Tous droits réservés.</p>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          {/* Logo mobile */}
          <div className="auth-mobile-logo">
            <img 
              src={theme === 'dark' ? darkLogo : lightLogo} 
              alt="SecureAuth+" 
            />
          </div>

          <div className="auth-form-header">
            <h2>Changer le mot de passe</h2>
            <p>Créez un nouveau mot de passe sécurisé pour votre compte</p>
          </div>

          {/* Alerte d'avertissement */}
          <div className="auth-alert warning">
            <Icons.Warning />
            <div className="auth-alert-content">
              <strong>Action requise</strong>
              <span>Vous devez changer votre mot de passe temporaire pour continuer.</span>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Mot de passe temporaire */}
            <div className={`auth-input-group ${focusedField === 'oldPassword' || passwordData.oldPassword ? 'focused' : ''}`}>
              <div className="auth-input-icon">
                <Icons.Lock />
              </div>
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                onFocus={() => setFocusedField('oldPassword')}
                onBlur={() => setFocusedField(null)}
                required
                autoFocus
                placeholder=" "
                className="auth-input"
              />
              <label className="auth-floating-label">Mot de passe temporaire</label>
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
            <p className="auth-input-hint">
              <Icons.Mail />
              <span>Consultez votre email pour le mot de passe temporaire</span>
            </p>

            {/* Nouveau mot de passe */}
            <div className={`auth-input-group ${focusedField === 'newPassword' || passwordData.newPassword ? 'focused' : ''}`}>
              <div className="auth-input-icon">
                <Icons.Shield />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                onFocus={() => setFocusedField('newPassword')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
                className="auth-input"
              />
              <label className="auth-floating-label">Nouveau mot de passe</label>
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>

            {/* Indicateur de force du mot de passe */}
            {passwordData.newPassword && (
              <div className="password-strength-section">
                <div className="password-strength-header">
                  <span>Force du mot de passe</span>
                  <span 
                    className="password-strength-label"
                    style={{ 
                      color: getPasswordStrengthInfo(passwordData.newPassword).color,
                      background: `color-mix(in srgb, ${getPasswordStrengthInfo(passwordData.newPassword).color} 15%, transparent)`
                    }}
                  >
                    {getPasswordStrengthInfo(passwordData.newPassword).label}
                  </span>
                </div>
                <div className="password-strength-bar">
                  <div 
                    className="password-strength-fill"
                    style={{ 
                      width: `${calculatePasswordStrength(passwordData.newPassword)}%`,
                      background: getPasswordStrengthInfo(passwordData.newPassword).color
                    }}
                  />
                </div>

                {/* Checklist des exigences */}
                <div className="password-requirements">
                  {[
                    { key: 'length', label: `Min. ${passwordPolicy?.minLength || 8} caractères` },
                    { key: 'uppercase', label: 'Une majuscule' },
                    { key: 'lowercase', label: 'Une minuscule' },
                    { key: 'number', label: 'Un chiffre' },
                    { key: 'special', label: 'Caractère spécial' }
                  ].map(req => {
                    const isValid = checkRequirement(passwordData.newPassword, req.key);
                    return (
                      <div 
                        key={req.key} 
                        className={`password-requirement-item ${isValid ? 'valid' : ''}`}
                      >
                        <div className="password-requirement-icon">
                          {isValid ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          )}
                        </div>
                        <span>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirmer le mot de passe */}
            <div className={`auth-input-group ${focusedField === 'confirmPassword' || passwordData.confirmPassword ? 'focused' : ''} ${passwordData.confirmPassword ? (passwordData.newPassword === passwordData.confirmPassword ? 'success' : 'error') : ''}`}>
              <div className="auth-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
                className="auth-input"
              />
              <label className="auth-floating-label">Confirmer le mot de passe</label>
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>

            {/* Indicateur de correspondance */}
            {passwordData.confirmPassword && (
              <div className={`password-match-indicator ${passwordData.newPassword === passwordData.confirmPassword ? 'match' : 'no-match'}`}>
                {passwordData.newPassword === passwordData.confirmPassword ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Les mots de passe correspondent</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>Les mots de passe ne correspondent pas</span>
                  </>
                )}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="auth-spinner">
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                  Mise à jour en cours...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  Sécuriser mon compte
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-form-footer">
            <div className="auth-secure-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Connexion sécurisée avec chiffrement SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForceChangePassword;
