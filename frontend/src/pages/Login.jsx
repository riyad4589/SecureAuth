import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import authService from '../services/authService';
import usePageTitle from '../hooks/usePageTitle';
import lightLogo from '../images/light_theme.png';
import darkLogo from '../images/dark_theme.png';

// Icônes SVG
const Icons = {
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Key: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Smartphone: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  Loader: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-spinner">
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  )
};

function Login({ setIsAuthenticated, setMustChangePassword }) {
  usePageTitle('Connexion');
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [twoFactorData, setTwoFactorData] = useState({
    tempToken: '',
    code: '',
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const errorTimerRef = useRef(null);
  const successTimerRef = useRef(null);
  const codeInputRefs = useRef([]);
  
  // Fonction pour afficher l'erreur avec timer
  const showError = (message) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(message);
    errorTimerRef.current = setTimeout(() => setError(''), 10000);
  };
  
  // Fonction pour afficher le message de succès avec timer
  const showSuccess = (message) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessMessage(message);
    successTimerRef.current = setTimeout(() => setSuccessMessage(''), 8000);
  };
  
  // Cleanup des timers
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);
  
  // Détecter les paramètres de l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const logoutType = params.get('logout');
    
    if (logoutType === 'session') {
      showSuccess('Vous avez été déconnecté avec succès. Votre session a été terminée en toute sécurité.');
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location.search]);
  
  // Détecter le thème actuel
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme') || 'light');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTwoFactorChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    
    const newCode = twoFactorData.code.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('').slice(0, 6);
    
    setTwoFactorData({
      ...twoFactorData,
      code: updatedCode,
    });
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !twoFactorData.code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setTwoFactorData({
      ...twoFactorData,
      code: pastedData,
    });
    if (pastedData.length === 6) {
      codeInputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      const responseData = response.data.data;

      if (responseData.requires2FA) {
        setTwoFactorData({
          tempToken: responseData.tempToken,
          code: '',
        });
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      const { accessToken, refreshToken, user, sessionToken } = responseData;
      authService.setTokens(accessToken, refreshToken, sessionToken);
      authService.setUser(user);
      localStorage.setItem('username', formData.username);
      setIsAuthenticated(true);
      
      if (user.mustChangePassword) {
        setMustChangePassword && setMustChangePassword(true);
        navigate('/change-password');
      } else {
        setMustChangePassword && setMustChangePassword(false);
        navigate('/dashboard');
      }
    } catch (err) {
      showError(
        err.response?.data?.message || 
        'Erreur de connexion. Vérifiez vos identifiants.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.post('/auth/verify-2fa', twoFactorData);
      const { accessToken, refreshToken, user, sessionToken } = response.data.data;

      authService.setTokens(accessToken, refreshToken, sessionToken);
      authService.setUser(user);
      localStorage.setItem('username', formData.username);
      setIsAuthenticated(true);
      
      if (user.mustChangePassword) {
        setMustChangePassword && setMustChangePassword(true);
        navigate('/change-password');
      } else {
        setMustChangePassword && setMustChangePassword(false);
        navigate('/dashboard');
      }
    } catch (err) {
      showError(
        err.response?.data?.message || 
        'Code 2FA invalide. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isWarning = error.includes('dernière tentative') || error.includes('⚠️');

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
            {/* <h1>Bienvenue !</h1> */}
            <p>Plateforme de gestion d'identité et d'accès sécurisée pour votre organisation.</p>
          </div>
          
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Shield />
              </div>
              <div className="auth-feature-text">
                <h3>Sécurité Avancée</h3>
                <p>Authentification multi-facteurs et chiffrement de bout en bout</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Key />
              </div>
              <div className="auth-feature-text">
                <h3>Gestion des Accès</h3>
                <p>Contrôle granulaire des permissions et des rôles</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Check />
              </div>
              <div className="auth-feature-text">
                <h3>Audit Complet</h3>
                <p>Traçabilité complète de toutes les activités</p>
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

          {!showTwoFactor ? (
            <>
              <div className="auth-form-header">
                <h2>Connexion</h2>
                <p>Entrez vos identifiants pour accéder à votre compte</p>
              </div>

              {/* Message de succès */}
              {successMessage && (
                <div className="auth-alert success">
                  <Icons.CheckCircle />
                  <div className="auth-alert-content">
                    <strong>Déconnexion réussie</strong>
                    <span>{successMessage}</span>
                  </div>
                  <button onClick={() => setSuccessMessage('')} className="auth-alert-close">
                    <Icons.X />
                  </button>
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className={`auth-alert ${isWarning ? 'warning' : 'error'}`}>
                  {isWarning ? <Icons.AlertTriangle /> : <Icons.AlertCircle />}
                  <div className="auth-alert-content">
                    <strong>{isWarning ? 'Attention' : 'Échec de connexion'}</strong>
                    <span>{error.replace('⚠️ ', '')}</span>
                  </div>
                  <button onClick={() => setError('')} className="auth-alert-close">
                    <Icons.X />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className={`auth-input-group ${focusedField === 'username' ? 'focused' : ''} ${formData.username ? 'has-value' : ''}`}>
                  <div className="auth-input-icon">
                    <Icons.User />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="username"
                    placeholder=" "
                  />
                  <label>Nom d'utilisateur</label>
                </div>

                <div className={`auth-input-group ${focusedField === 'password' ? 'focused' : ''} ${formData.password ? 'has-value' : ''}`}>
                  <div className="auth-input-icon">
                    <Icons.Lock />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="current-password"
                    placeholder=" "
                  />
                  <label>Mot de passe</label>
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Icons.Loader />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>Pas encore de compte ?</span>
              </div>

              <Link to="/register" className="auth-secondary-btn">
                Demander un accès
              </Link>
            </>
          ) : (
            <>
              <div className="auth-form-header">
                <div className="auth-2fa-icon">
                  <Icons.Smartphone />
                </div>
                <h2>Vérification 2FA</h2>
                <p>Entrez le code à 6 chiffres de votre application d'authentification</p>
              </div>

              {error && (
                <div className="auth-alert error">
                  <Icons.AlertCircle />
                  <div className="auth-alert-content">
                    <strong>Code invalide</strong>
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="auth-alert-close">
                    <Icons.X />
                  </button>
                </div>
              )}

              <form onSubmit={handleTwoFactorSubmit} className="auth-form">
                <div className="auth-code-inputs" onPaste={handlePaste}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (codeInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={twoFactorData.code[index] || ''}
                      onChange={(e) => handleTwoFactorChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="auth-code-input"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || twoFactorData.code.length !== 6}
                >
                  {loading ? (
                    <>
                      <Icons.Loader />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <>
                      <span>Vérifier le code</span>
                      <Icons.Check />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFactor(false);
                    setTwoFactorData({ tempToken: '', code: '' });
                    setError('');
                  }}
                  className="auth-back-btn"
                >
                  <Icons.ArrowLeft />
                  <span>Retour à la connexion</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
