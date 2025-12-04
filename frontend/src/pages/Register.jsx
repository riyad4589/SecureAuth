import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
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
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Building: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
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
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
};

function Register() {
  usePageTitle('Inscription');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phoneNumber: '',
    requestReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const toast = useToast();
  
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/v1/registration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Votre demande sera traitée par un administrateur', {
          title: '✅ Demande envoyée avec succès !',
          icon: 'user',
          duration: 8000
        });
        setFormData({ firstName: '', lastName: '', email: '', companyName: '', phoneNumber: '', requestReason: '' });
      } else {
        toast.error(data.message || 'L\'inscription a échoué. Veuillez réessayer.', {
          title: 'Erreur d\'inscription',
          icon: 'error'
        });
      }
    } catch (error) {
      toast.error('Erreur réseau. Vérifiez votre connexion et réessayez.', {
        title: 'Erreur de connexion',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
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
            <h1>Rejoignez SecureAuth+</h1>
            <p>Demandez l'accès à notre plateforme de gestion d'identité sécurisée.</p>
          </div>
          
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Shield />
              </div>
              <div className="auth-feature-text">
                <h3>Accès Sécurisé</h3>
                <p>Toutes les demandes sont vérifiées par nos administrateurs</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Users />
              </div>
              <div className="auth-feature-text">
                <h3>Gestion Centralisée</h3>
                <p>Un compte unique pour tous les services de votre organisation</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Icons.Clock />
              </div>
              <div className="auth-feature-text">
                <h3>Traitement Rapide</h3>
                <p>Réponse dans les 24 à 48 heures ouvrables</p>
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
        <div className="auth-form-wrapper register">
          {/* Logo mobile */}
          <div className="auth-mobile-logo">
            <img 
              src={theme === 'dark' ? darkLogo : lightLogo} 
              alt="SecureAuth+" 
            />
          </div>

          <div className="auth-form-header">
            <h2>Demande d'accès</h2>
            <p>Remplissez le formulaire pour demander un compte</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-row">
              <div className={`auth-input-group ${focusedField === 'firstName' ? 'focused' : ''} ${formData.firstName ? 'has-value' : ''}`}>
                <div className="auth-input-icon">
                  <Icons.User />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder=" "
                />
                <label>Prénom</label>
              </div>

              <div className={`auth-input-group ${focusedField === 'lastName' ? 'focused' : ''} ${formData.lastName ? 'has-value' : ''}`}>
                <div className="auth-input-icon">
                  <Icons.User />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder=" "
                />
                <label>Nom</label>
              </div>
            </div>

            <div className={`auth-input-group ${focusedField === 'email' ? 'focused' : ''} ${formData.email ? 'has-value' : ''}`}>
              <div className="auth-input-icon">
                <Icons.Mail />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
              />
              <label>Adresse email</label>
            </div>

            <div className={`auth-input-group ${focusedField === 'companyName' ? 'focused' : ''} ${formData.companyName ? 'has-value' : ''}`}>
              <div className="auth-input-icon">
                <Icons.Building />
              </div>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                onFocus={() => setFocusedField('companyName')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
              />
              <label>Nom de l'entreprise</label>
            </div>

            <div className={`auth-input-group ${focusedField === 'phoneNumber' ? 'focused' : ''} ${formData.phoneNumber ? 'has-value' : ''}`}>
              <div className="auth-input-icon">
                <Icons.Phone />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                onFocus={() => setFocusedField('phoneNumber')}
                onBlur={() => setFocusedField(null)}
                placeholder=" "
              />
              <label>Téléphone (optionnel)</label>
            </div>

            <div className={`auth-input-group textarea ${focusedField === 'requestReason' ? 'focused' : ''} ${formData.requestReason ? 'has-value' : ''}`}>
              <div className="auth-input-icon">
                <Icons.FileText />
              </div>
              <textarea
                name="requestReason"
                value={formData.requestReason}
                onChange={handleChange}
                onFocus={() => setFocusedField('requestReason')}
                onBlur={() => setFocusedField(null)}
                rows="3"
                placeholder=" "
              />
              <label>Motif de la demande (optionnel)</label>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icons.Loader />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>Envoyer la demande</span>
                  <Icons.Send />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Déjà un compte ?</span>
          </div>

          <Link to="/login" className="auth-secondary-btn">
            <Icons.ArrowLeft />
            <span>Retour à la connexion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
