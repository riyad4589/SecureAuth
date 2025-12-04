import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import usePageTitle from '../hooks/usePageTitle';

function AccountSecurity({ setIsAuthenticated }) {
  usePageTitle('Sécurité du compte');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lire le paramètre de section depuis l'URL
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && ['password', '2fa', 'sessions', 'apikeys'].includes(section)) {
      return section;
    }
    return 'password';
  };

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKey, setNewApiKey] = useState(null);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    description: '',
    expirationDays: 90
  });
  const [passwordPolicy, setPasswordPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Modal de confirmation de mot de passe pour 2FA
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    action: null, // 'enable' ou 'disable'
    password: '',
    showPassword: false
  });

  // Mettre à jour l'onglet si l'URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && ['password', '2fa', 'sessions', 'apikeys'].includes(section)) {
      setActiveTab(section);
    }
  }, [location.search]);

  useEffect(() => {
    loadPasswordPolicy();
    loadSessions();
    loadApiKeys();
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      const response = await authAPI.get('/account/2fa/status');
      console.log('2FA status response:', response.data);
      setTwoFactorEnabled(response.data.data === true);
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    }
  };

  const loadPasswordPolicy = async () => {
    try {
      const response = await authAPI.get('/account/password-policy');
      setPasswordPolicy(response.data.data);
    } catch (err) {
      console.error('Failed to load password policy:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await authAPI.get('/account/sessions');
      console.log('Sessions loaded:', response.data.data);
      console.log('Session token in localStorage:', localStorage.getItem('sessionToken'));
      setSessions(response.data.data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await authAPI.get('/account/api-keys');
      setApiKeys(response.data.data);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.post('/account/change-password', passwordData);
      toast.success('Votre mot de passe a été modifié avec succès', {
        title: '🔐 Mot de passe changé',
        icon: 'password'
      });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Échec du changement de mot de passe', {
        title: 'Erreur',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setPasswordModal({
      isOpen: true,
      action: 'enable',
      password: '',
      showPassword: false
    });
  };

  const handleDisable2FA = async () => {
    setPasswordModal({
      isOpen: true,
      action: 'disable',
      password: '',
      showPassword: false
    });
  };

  const handlePasswordModalConfirm = async () => {
    if (!passwordModal.password) return;
    
    setLoading(true);

    try {
      if (passwordModal.action === 'enable') {
        const response = await authAPI.post('/account/2fa/enable', { password: passwordModal.password });
        setQrCode(response.data.data.qrCodeUrl);
        toast.info('Scannez le QR code avec Google Authenticator', {
          title: '📱 Configuration 2FA',
          icon: 'shield',
          duration: 8000
        });
      } else if (passwordModal.action === 'disable') {
        await authAPI.post('/account/2fa/disable', { password: passwordModal.password });
        toast.success('L\'authentification à deux facteurs a été désactivée', {
          title: '🔓 2FA désactivée',
          icon: 'shield'
        });
        setTwoFactorEnabled(false);
      }
      setPasswordModal({ isOpen: false, action: null, password: '', showPassword: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mot de passe incorrect', {
        title: 'Échec de l\'authentification',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);

    try {
      await authAPI.post('/account/2fa/verify', { 
        code: verificationCode
      });
      toast.success('Vous pouvez maintenant utiliser Google Authenticator pour vous connecter', {
        title: '🛡️ 2FA activée avec succès !',
        icon: 'shield',
        duration: 8000
      });
      setTwoFactorEnabled(true);
      setQrCode('');
      setVerificationCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code de vérification invalide. Vérifiez votre app Google Authenticator.', {
        title: 'Code incorrect',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateSession = async (sessionId, isCurrentSession = false) => {
    // Si c'est la session actuelle, on déconnecte directement sans appeler l'API
    // car l'API invaliderait notre propre token et retournerait une erreur
    if (isCurrentSession) {
      try {
        // Tenter d'invalider la session côté serveur d'abord
        await authAPI.delete(`/account/sessions/${sessionId}`);
      } catch (err) {
        // Ignorer les erreurs - on va se déconnecter de toute façon
        console.log('Session invalidation during logout:', err);
      }
      // Déconnecter l'utilisateur localement et rediriger avec un message
      authService.logout();
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate('/login?logout=session');
      return;
    }
    
    try {
      await authAPI.delete(`/account/sessions/${sessionId}`);
      
      toast.success('La session a été déconnectée', {
        title: '🔌 Session terminée',
        icon: 'session'
      });
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la déconnexion de la session', {
        title: 'Erreur',
        icon: 'error'
      });
    }
  };

  const handleInvalidateAllSessions = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter toutes les autres sessions ?')) {
      return;
    }
    
    try {
      await authAPI.delete('/account/sessions');
      toast.success('Toutes les autres sessions ont été déconnectées', {
        title: '🔌 Sessions terminées',
        icon: 'session'
      });
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la déconnexion des sessions', {
        title: 'Erreur',
        icon: 'error'
      });
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.post('/account/api-keys', apiKeyForm);
      setNewApiKey(response.data.data.fullKey);
      toast.success('Copiez-la maintenant, elle ne sera plus affichée !', {
        title: '🔑 Clé API créée',
        icon: 'key',
        duration: 10000
      });
      setApiKeyForm({ name: '', description: '', expirationDays: 90 });
      loadApiKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la création de la clé API', {
        title: 'Erreur',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (apiKeyId) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé API ? Cette action est irréversible.')) {
      return;
    }

    try {
      await authAPI.delete(`/account/api-keys/${apiKeyId}`);
      toast.success('La clé API a été révoquée et ne peut plus être utilisée', {
        title: '🗑️ Clé API révoquée',
        icon: 'trash'
      });
      loadApiKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la révocation', {
        title: 'Erreur',
        icon: 'error'
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Le contenu a été copié dans le presse-papiers', {
      title: '📋 Copié !',
      icon: 'copy',
      duration: 2000
    });
  };

  const getPasswordStrengthLabel = (password) => {
    const strength = calculatePasswordStrength(password);
    if (strength < 30) return { label: 'Faible', color: 'var(--color-danger)' };
    if (strength < 60) return { label: 'Moyen', color: 'var(--color-warning)' };
    if (strength < 80) return { label: 'Bon', color: 'var(--color-info)' };
    return { label: 'Excellent', color: 'var(--color-success)' };
  };

  const getPasswordStrengthColor = (password) => {
    if (!password) return 'var(--border-light)';
    const strength = calculatePasswordStrength(password);
    if (strength < 30) return 'var(--color-danger)';
    if (strength < 60) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
    return strength;
  };

  const tabs = [
    { id: 'password', label: 'Mot de passe', iconType: 'password' },
    { id: '2fa', label: 'Authentification 2FA', iconType: 'twofa' },
    { id: 'sessions', label: 'Sessions', iconType: 'sessions', count: sessions.length },
    { id: 'apikeys', label: 'Clés API', iconType: 'apikeys', count: apiKeys.length }
  ];

  const getTabIcon = (iconType) => {
    switch(iconType) {
      case 'password':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
      case 'twofa':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
      case 'sessions':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
      case 'apikeys':
        return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* Header avec icône de sécurité */}
      <div className="page-header-box">
        <div className="page-header-icon security">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Sécurité du compte</h1>
          <p className="page-subtitle">Gérez vos paramètres de sécurité et protégez votre compte</p>
        </div>
      </div>

      {/* Navigation par onglets améliorée */}
      <div className="security-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`security-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="security-tab-icon">{getTabIcon(tab.iconType)}</span>
            <span className="security-tab-label">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="security-tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className="security-content">
        
        {/* Section Mot de passe */}
        {activeTab === 'password' && (
          <div className="security-section animate-fadeIn">
            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon password">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="security-card-title">Changer le mot de passe</h2>
                  <p className="security-card-desc">Mettez à jour votre mot de passe régulièrement pour sécuriser votre compte</p>
                </div>
                <div className="status-badge info">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Sécurisé
                </div>
              </div>

              <div className="section-content">
                {passwordPolicy && (
                  <div className="policy-box">
                    <div className="policy-header">
                      <span className="policy-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </span>
                      <span className="policy-title">Exigences du mot de passe</span>
                    </div>
                    <div className="policy-grid">
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Minimum {passwordPolicy.minLength} caractères</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Au moins une majuscule</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Au moins une minuscule</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Au moins un chiffre</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Au moins un caractère spécial</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        <span>Différent des {passwordPolicy.passwordHistoryCount} derniers</span>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="security-form">
                  <div className="form-group">
                    <label className="form-label">Mot de passe actuel</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="form-input"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="Entrez votre mot de passe actuel"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        title={showOldPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showOldPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nouveau mot de passe</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Entrez un nouveau mot de passe"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={showNewPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showNewPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordData.newPassword && (
                      <div className="password-strength">
                        <div className="password-strength-bar">
                          <div 
                            className="password-strength-fill"
                            style={{ 
                              width: `${calculatePasswordStrength(passwordData.newPassword)}%`,
                              backgroundColor: getPasswordStrengthColor(passwordData.newPassword)
                            }}
                          />
                        </div>
                        <span 
                          className="password-strength-label"
                          style={{ color: getPasswordStrengthColor(passwordData.newPassword) }}
                        >
                          {getPasswordStrengthLabel(passwordData.newPassword).label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmer le nouveau mot de passe</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirmez le nouveau mot de passe"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={showConfirmPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <span className="form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Les mots de passe ne correspondent pas
                      </span>
                    )}
                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                      <span className="form-success">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Les mots de passe correspondent
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner"></span>
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Section 2FA */}
        {activeTab === '2fa' && (
          <div className="security-section animate-fadeIn">
            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon twofa">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <div>
                  <h2 className="security-card-title">Authentification à deux facteurs</h2>
                  <p className="security-card-desc">Ajoutez une couche de sécurité supplémentaire avec Google Authenticator</p>
                </div>
                <div className={`status-badge ${twoFactorEnabled ? 'active' : 'inactive'}`}>
                  {twoFactorEnabled ? '✓ Activé' : '○ Désactivé'}
                </div>
              </div>

              {!twoFactorEnabled && !qrCode && (
                <div className="twofa-setup">
                  <div className="twofa-steps">
                    <div className="twofa-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Téléchargez l'application</h4>
                        <p>Installez Google Authenticator sur votre téléphone</p>
                      </div>
                    </div>
                    <div className="twofa-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Scannez le QR code</h4>
                        <p>Cliquez sur "Activer" et scannez le code affiché</p>
                      </div>
                    </div>
                    <div className="twofa-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Vérifiez le code</h4>
                        <p>Entrez le code à 6 chiffres de l'application</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleEnable2FA}
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Activer l\'authentification 2FA'}
                  </button>
                </div>
              )}

              {qrCode && (
                <div className="twofa-verify">
                  <div className="qr-container">
                    <div className="qr-wrapper">
                      <img src={qrCode} alt="QR Code" className="qr-image" />
                    </div>
                    <p className="qr-hint">Scannez ce code avec Google Authenticator</p>
                  </div>

                  <div className="verify-form">
                    <label className="form-label">Code de vérification</label>
                    <div className="code-input-wrapper">
                      <input
                        type="text"
                        className="code-input"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        maxLength="6"
                      />
                    </div>
                    <p className="form-help">Entrez le code à 6 chiffres affiché dans l'application</p>

                    <button 
                      onClick={handleVerify2FA}
                      className="btn btn-primary btn-lg"
                      disabled={loading || verificationCode.length !== 6}
                    >
                      {loading ? 'Vérification...' : 'Vérifier et activer'}
                    </button>
                  </div>
                </div>
              )}

              {twoFactorEnabled && (
                <div className="twofa-enabled">
                  <div className="enabled-message">
                    <span className="enabled-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </span>
                    <div>
                      <h4>Votre compte est protégé</h4>
                      <p>L'authentification à deux facteurs est active. Vous aurez besoin de votre téléphone pour vous connecter.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDisable2FA}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Désactiver 2FA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Sessions */}
        {activeTab === 'sessions' && (
          <div className="security-section animate-fadeIn">
            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon sessions">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div>
                  <h2 className="security-card-title">Sessions actives</h2>
                  <p className="security-card-desc">Gérez vos appareils connectés et déconnectez les sessions suspectes</p>
                </div>
                <div className={`status-badge ${sessions.length > 0 ? 'active' : 'inactive'}`}>
                  {sessions.length > 0 ? `${sessions.length} active${sessions.length > 1 ? 's' : ''}` : 'Aucune'}
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="section-content-empty">
                  <div className="empty-state-modern">
                    <div className="empty-icon-container sessions">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                    <h4>Aucune session active</h4>
                    <p>Il n'y a pas de sessions actives pour le moment</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Sessions Overview Panel */}
                  <div className="sessions-overview-panel">
                    <div className="sessions-overview-header">
                      <div className="sessions-overview-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <div className="sessions-overview-content">
                        <h3>Centre de Surveillance des Sessions</h3>
                        <p>Gardez le contrôle total sur vos connexions actives</p>
                      </div>
                    </div>
                    
                    <div className="sessions-stats-grid">
                      <div className="session-stat-card">
                        <div className="stat-icon active">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">{sessions.length}</span>
                          <span className="stat-label">Session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div className="session-stat-card">
                        <div className="stat-icon current">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">1</span>
                          <span className="stat-label">Session actuelle</span>
                        </div>
                      </div>
                      
                      <div className="session-stat-card">
                        <div className="stat-icon others">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">{sessions.length - 1}</span>
                          <span className="stat-label">Autre{sessions.length - 1 !== 1 ? 's' : ''} appareil{sessions.length - 1 !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    {sessions.length > 1 && (
                      <div className="sessions-bulk-action">
                        <button 
                          onClick={handleInvalidateAllSessions}
                          className="btn-disconnect-all"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          <span>Déconnecter toutes les autres sessions</span>
                          <span className="disconnect-count">{sessions.length - 1}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="sessions-list">
                    {sessions.map((session) => {
                      const getDeviceIcon = (ua) => {
                        if (!ua) return '💻';
                        const lowerUA = ua.toLowerCase();
                        if (lowerUA.includes('mobile') || lowerUA.includes('iphone') || lowerUA.includes('android')) return '📱';
                        if (lowerUA.includes('tablette') || lowerUA.includes('ipad')) return '📱';
                        if (lowerUA.includes('postman') || lowerUA.includes('curl') || lowerUA.includes('node')) return '🔧';
                        return '💻';
                      };
                      
                      return (
                        <div 
                          key={session.id} 
                          className={`session-item ${session.currentSession ? 'current' : ''}`}
                        >
                          <div className="session-icon">
                            {getDeviceIcon(session.userAgent)}
                          </div>
                          <div className="session-info">
                            <div className="session-device">
                              {session.userAgent || 'Appareil inconnu'}
                              {session.currentSession && (
                                <span className="current-badge">Session actuelle</span>
                              )}
                            </div>
                            <div className="session-details">
                              <span>📍 {session.ipAddress}</span>
                              <span>🕐 {new Date(session.lastActivity).toLocaleString('fr-FR')}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleInvalidateSession(session.id, session.currentSession)}
                            className={`btn btn-sm ${session.currentSession ? 'btn-danger' : 'btn-secondary'}`}
                          >
                            {session.currentSession ? '🚪 Me déconnecter' : 'Déconnecter'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Section API Keys */}
        {activeTab === 'apikeys' && (
          <div className="security-section animate-fadeIn">
            {/* Nouvelle clé API */}
            {newApiKey && (
              <div className="new-api-key-banner">
                <div className="banner-header">
                  <span className="banner-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </span>
                  <span className="banner-title">Nouvelle clé API créée</span>
                </div>
                <div className="banner-content">
                  <p className="banner-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Copiez cette clé maintenant. Elle ne sera plus affichée.
                  </p>
                  <div className="key-display">
                    <code>{newApiKey}</code>
                    <button 
                      onClick={() => copyToClipboard(newApiKey)}
                      className="btn btn-sm btn-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copier
                    </button>
                  </div>
                </div>
                <button onClick={() => setNewApiKey(null)} className="banner-close">×</button>
              </div>
            )}

            <div className="security-card">
              <div className="security-card-header">
                <div className="security-card-icon apikeys">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="security-card-title">Clés API</h2>
                  <p className="security-card-desc">Gérez vos clés d'accès API pour les intégrations externes</p>
                </div>
                <div className={`status-badge ${apiKeys.filter(k => k.active).length > 0 ? 'active' : 'inactive'}`}>
                  {apiKeys.filter(k => k.active).length > 0 
                    ? `${apiKeys.filter(k => k.active).length} active${apiKeys.filter(k => k.active).length > 1 ? 's' : ''}` 
                    : 'Aucune'}
                </div>
              </div>

              <div className="section-content">
                <div className="apikeys-layout">
                  {/* Formulaire de création */}
                  <div className="apikeys-form-section">
                    <div className="section-header-mini">
                      <span className="section-header-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </span>
                      <span>Créer une nouvelle clé</span>
                    </div>
                    
                    <form onSubmit={handleCreateApiKey} className="security-form-compact">
                      <div className="form-group">
                        <label className="form-label">Nom de la clé</label>
                        <input
                          type="text"
                          className="form-input"
                          value={apiKeyForm.name}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                          placeholder="Ex: Serveur de production"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description (optionnel)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={apiKeyForm.description}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, description: e.target.value })}
                          placeholder="Ex: Clé pour le déploiement CI/CD"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Expiration</label>
                        <select
                          className="form-select"
                          value={apiKeyForm.expirationDays}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, expirationDays: parseInt(e.target.value) })}
                        >
                          <option value="30">30 jours</option>
                          <option value="90">90 jours</option>
                          <option value="180">180 jours</option>
                          <option value="365">1 an</option>
                          <option value="0">Jamais</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="btn-spinner"></span>
                            Création...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Créer la clé
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Liste des clés */}
                  <div className="apikeys-list-section">
                    <div className="section-header-mini">
                      <span className="section-header-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                      </span>
                      <span>Vos clés API</span>
                      <span className="keys-count">{apiKeys.length}</span>
                    </div>

                    {apiKeys.length === 0 ? (
                      <div className="empty-state-modern compact">
                        <div className="empty-icon-container apikeys">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                          </svg>
                        </div>
                        <p>Aucune clé API créée</p>
                      </div>
                    ) : (
                      <div className="api-keys-list">
                        {apiKeys.map((apiKey) => (
                          <div 
                            key={apiKey.id} 
                            className={`api-key-item ${!apiKey.active ? 'revoked' : ''}`}
                          >
                            <div className="api-key-icon">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                              </svg>
                            </div>
                            <div className="api-key-info">
                              <div className="api-key-name">
                                {apiKey.name}
                                {!apiKey.active && <span className="revoked-badge">Révoquée</span>}
                                {apiKey.active && <span className="active-badge">Active</span>}
                              </div>
                              {apiKey.description && (
                                <div className="api-key-desc">{apiKey.description}</div>
                              )}
                              <div className="api-key-meta">
                                <code className="api-key-prefix">{apiKey.keyPrefix}•••</code>
                                <span className="api-key-dates">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                  {new Date(apiKey.createdAt).toLocaleDateString('fr-FR')}
                                  {apiKey.expiresAt && (
                                    <>
                                      <span className="meta-separator">•</span>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                      </svg>
                                      Expire le {new Date(apiKey.expiresAt).toLocaleDateString('fr-FR')}
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            {apiKey.active && (
                              <button 
                                onClick={() => handleRevokeApiKey(apiKey.id)}
                                className="btn btn-sm btn-danger-outline"
                                title="Révoquer cette clé"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="15" y1="9" x2="9" y2="15"/>
                                  <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                                Révoquer
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation mot de passe pour 2FA */}
      {passwordModal.isOpen && (
        <div className="modal-overlay" onClick={() => setPasswordModal({ isOpen: false, action: null, password: '', showPassword: false })}>
          <div className="modal-content modal-sm animate-slideIn" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-container" style={{ 
                backgroundColor: passwordModal.action === 'enable' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)' 
              }}>
                {passwordModal.action === 'enable' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                )}
              </div>
              <h3 className="modal-title">
                {passwordModal.action === 'enable' 
                  ? 'Activer l\'authentification 2FA' 
                  : 'Désactiver l\'authentification 2FA'}
              </h3>
              <p className="modal-subtitle">
                {passwordModal.action === 'enable' 
                  ? 'Entrez votre mot de passe pour sécuriser davantage votre compte' 
                  : 'Confirmez votre mot de passe pour désactiver la 2FA'}
              </p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordModalConfirm(); }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary-bg)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  Mot de passe actuel
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <input
                    type={passwordModal.showPassword ? 'text' : 'password'}
                    value={passwordModal.password}
                    onChange={(e) => setPasswordModal(prev => ({ ...prev, password: e.target.value }))}
                    className="form-control"
                    placeholder="••••••••••••"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '14px 52px 14px 16px',
                      fontSize: '15px',
                      borderRadius: '12px',
                      border: '2px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      transition: 'all 0.2s ease',
                      letterSpacing: passwordModal.showPassword ? 'normal' : '2px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: passwordModal.showPassword 
                        ? 'var(--color-primary-bg)' 
                        : 'transparent',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: passwordModal.showPassword 
                        ? 'var(--color-primary)' 
                        : 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => {
                      if (!passwordModal.showPassword) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!passwordModal.showPassword) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                    title={passwordModal.showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {passwordModal.showPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <path d="m9.9 9.9 4.2 4.2"/>
                        <circle cx="12" cy="12" r="3" opacity="0.5"/>
                        <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Entrez votre mot de passe pour confirmer cette action
                </p>
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setPasswordModal({ isOpen: false, action: null, password: '', showPassword: false })}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: '500',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn ${passwordModal.action === 'enable' ? 'btn-success' : 'btn-danger'}`}
                  disabled={loading || !passwordModal.password}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                      Vérification...
                    </span>
                  ) : (
                    <>
                      {passwordModal.action === 'enable' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      )}
                      {passwordModal.action === 'enable' ? 'Activer la 2FA' : 'Désactiver la 2FA'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSecurity;
