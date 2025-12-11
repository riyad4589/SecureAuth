import { useState, useEffect } from 'react';
import '../styles/theme.css';

function PasswordModal({ isOpen, onClose, password, username, type = 'create' }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyAll = async () => {
    const text = `Identifiant: ${username}\nMot de passe: ${password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  const isReset = type === 'reset';
  const title = isReset ? 'Mot de passe réinitialisé' : 'Compte validé avec succès';

  const getIcon = () => {
    if (isReset) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="16" r="1"/>
          <rect x="3" y="10" width="18" height="12" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="m9 10 2-2 2 2"/>
          <path d="M12 12v4"/>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }
  };

  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="password-modal-header">
          <div className="password-modal-icon">
            {getIcon()}
          </div>
          <h2>{title}</h2>
          <p>
            {isReset 
              ? `Un nouveau mot de passe temporaire a été généré pour ${username}.`
              : `Le compte de ${username} a été validé avec succès.`
            }
          </p>
        </div>

        {/* Credentials Box */}
        <div className="password-modal-credentials">
          {!isReset && (
            <div className="password-modal-field">
              <label>Identifiant</label>
              <div className="password-modal-value">
                <span><strong>{username}</strong></span>
              </div>
            </div>
          )}
          
          <div className="password-modal-field">
            <label>Mot de passe temporaire</label>
            <div className="password-modal-value password">
              <code>{password}</code>
              <button 
                className={`password-modal-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copier le mot de passe"
              >
                {copied ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="password-modal-warning">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Ce mot de passe est temporaire. L'utilisateur devra le changer lors de sa première connexion.</span>
        </div>

        {/* Actions */}
        <div className="password-modal-actions">
          {!isReset && (
            <button className="password-modal-btn secondary" onClick={handleCopyAll}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copier tout
            </button>
          )}
          <button className="password-modal-btn primary" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {copied ? 'Copié !' : 'Compris'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordModal;
