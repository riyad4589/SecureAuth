import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Contexte pour les toasts
const ToastContext = createContext();

// Hook pour utiliser les toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Icônes SVG pour chaque type
const ToastIcons = {
  success: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="url(#successGrad)" strokeWidth="2" fill="rgba(34, 197, 94, 0.15)"/>
      <path d="M8 12l3 3 5-6" stroke="#22c55e" strokeWidth="2.5"/>
    </svg>
  ),
  error: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="url(#errorGrad)" strokeWidth="2" fill="rgba(239, 68, 68, 0.15)"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2.5"/>
    </svg>
  ),
  warning: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="warningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <path d="M12 2L2 22h20L12 2z" stroke="url(#warningGrad)" strokeWidth="2" fill="rgba(245, 158, 11, 0.15)"/>
      <path d="M12 9v4" stroke="#f59e0b" strokeWidth="2.5"/>
      <circle cx="12" cy="17" r="1" fill="#f59e0b"/>
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="infoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="url(#infoGrad)" strokeWidth="2" fill="rgba(59, 130, 246, 0.15)"/>
      <path d="M12 16v-4" stroke="#3b82f6" strokeWidth="2.5"/>
      <circle cx="12" cy="8" r="1" fill="#3b82f6"/>
    </svg>
  ),
  password: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="passwordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="url(#passwordGrad)" strokeWidth="2" fill="rgba(139, 92, 246, 0.15)"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#8b5cf6" strokeWidth="2"/>
      <circle cx="12" cy="16" r="1.5" fill="#8b5cf6"/>
    </svg>
  ),
  key: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="keyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="url(#keyGrad)" strokeWidth="2" fill="none"/>
    </svg>
  ),
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="4" stroke="url(#userGrad)" strokeWidth="2" fill="rgba(6, 182, 212, 0.15)"/>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#06b6d4" strokeWidth="2"/>
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shieldGrad)" strokeWidth="2" fill="rgba(34, 197, 94, 0.15)"/>
      <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2.5"/>
    </svg>
  ),
  copy: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="copyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="url(#copyGrad)" strokeWidth="2" fill="rgba(16, 185, 129, 0.15)"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#10b981" strokeWidth="2"/>
      <path d="M13 14l2 2 3-3" stroke="#10b981" strokeWidth="2"/>
    </svg>
  ),
  session: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="sessionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="url(#sessionGrad)" strokeWidth="2" fill="rgba(59, 130, 246, 0.15)"/>
      <path d="M8 21h8M12 17v4" stroke="#3b82f6" strokeWidth="2"/>
    </svg>
  ),
  trash: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="trashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <path d="M3 6h18" stroke="url(#trashGrad)" strokeWidth="2"/>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ef4444" strokeWidth="2"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="#ef4444" strokeWidth="2" fill="rgba(239, 68, 68, 0.1)"/>
    </svg>
  ),
  unlock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="unlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="url(#unlockGrad)" strokeWidth="2" fill="rgba(34, 197, 94, 0.15)"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="#22c55e" strokeWidth="2"/>
    </svg>
  ),
  role: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="roleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#roleGrad)" strokeWidth="2" fill="rgba(139, 92, 246, 0.15)"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#8b5cf6" strokeWidth="2"/>
    </svg>
  )
};

// Composant Toast individuel
const ToastItem = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    if (toast.icon && ToastIcons[toast.icon]) {
      return ToastIcons[toast.icon];
    }
    return ToastIcons[toast.type] || ToastIcons.info;
  };

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
        {toast.details && <div className="toast-details">{toast.details}</div>}
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Fermer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      {toast.duration !== Infinity && (
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${toast.duration || 5000}ms` }}
        />
      )}
    </div>
  );
};

// Provider des toasts
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: 'info',
      duration: 5000,
      ...options
    };
    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Helpers pour différents types
  const success = useCallback((message, options = {}) => 
    addToast({ type: 'success', message, ...options }), [addToast]);
  
  const error = useCallback((message, options = {}) => 
    addToast({ type: 'error', message, ...options }), [addToast]);
  
  const warning = useCallback((message, options = {}) => 
    addToast({ type: 'warning', message, ...options }), [addToast]);
  
  const info = useCallback((message, options = {}) => 
    addToast({ type: 'info', message, ...options }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll, success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
