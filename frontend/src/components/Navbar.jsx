import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { authAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import lightLogo from '../images/light_theme.png';
import darkLogo from '../images/dark_theme.png';

// Icônes SVG inline pour éviter les dépendances
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Security: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Roles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Registrations: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  Audit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
};

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
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

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Fermer le menu utilisateur en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.logout();
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  // Menu items configuration
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard, show: true },
    { path: '/account/security', label: 'Sécurité', icon: Icons.Security, show: true },
    { path: '/users', label: 'Utilisateurs', icon: Icons.Users, show: authService.hasAnyRole(['ADMIN', 'MANAGER']) },
    { path: '/roles', label: 'Rôles', icon: Icons.Roles, show: authService.hasRole('ADMIN') },
    { path: '/registrations', label: 'Inscriptions', icon: Icons.Registrations, show: authService.hasRole('ADMIN') },
    { path: '/audit', label: 'Audit', icon: Icons.Audit, show: authService.hasAnyRole(['ADMIN', 'SECURITY']) },
  ].filter(item => item.show);

  // Obtenir le rôle principal pour le badge
  const getPrimaryRole = () => {
    const roles = user?.roles || [];
    if (roles.includes('ADMIN')) return { name: 'Admin', color: 'danger' };
    if (roles.includes('SECURITY')) return { name: 'Security', color: 'warning' };
    if (roles.includes('MANAGER')) return { name: 'Manager', color: 'info' };
    return { name: 'User', color: 'default' };
  };

  const primaryRole = getPrimaryRole();

  return (
    <>
      <nav className="navbar-modern">
        <div className="navbar-modern-content">
          {/* Logo */}
          <Link to="/dashboard" className="navbar-modern-brand">
            <img 
              src={theme === 'dark' ? darkLogo : lightLogo} 
              alt="SecureAuth+" 
              className="navbar-modern-logo"
            />
          </Link>

          {/* Menu Desktop */}
          <ul className="navbar-modern-menu">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`navbar-modern-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions droite */}
          <div className="navbar-modern-actions">
            <ThemeToggle />
            
            {/* Menu utilisateur */}
            <div className="navbar-user-dropdown" ref={userMenuRef}>
              <button 
                className="navbar-user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
              >
                <div className="navbar-user-avatar">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="navbar-user-details">
                  <span className="navbar-user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className={`navbar-user-role-badge ${primaryRole.color}`}>
                    {primaryRole.name}
                  </span>
                </div>
                <span className={`navbar-user-chevron ${userMenuOpen ? 'open' : ''}`}>
                  <Icons.ChevronDown />
                </span>
              </button>

              {/* Dropdown menu */}
              <div className={`navbar-dropdown-menu ${userMenuOpen ? 'open' : ''}`}>
                <div className="navbar-dropdown-header">
                  <div className="navbar-dropdown-user-info">
                    <span className="navbar-dropdown-fullname">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="navbar-dropdown-username">
                      @{user?.username}
                    </span>
                    <span className="navbar-dropdown-email">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <div className="navbar-dropdown-divider"></div>
                <Link to="/account/security" className="navbar-dropdown-item">
                  <Icons.Security />
                  <span>Sécurité du compte</span>
                </Link>
                <div className="navbar-dropdown-divider"></div>
                <button onClick={handleLogout} className="navbar-dropdown-item logout">
                  <Icons.Logout />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>

            {/* Bouton hamburger mobile */}
            <button 
              className="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="navbar-mobile-user">
            <div className="navbar-user-avatar large">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="navbar-mobile-user-info">
              <span className="navbar-mobile-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className={`navbar-user-role-badge ${primaryRole.color}`}>
                {primaryRole.name}
              </span>
            </div>
          </div>
          
          <div className="navbar-mobile-divider"></div>
          
          <ul className="navbar-mobile-links">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`navbar-mobile-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="navbar-mobile-divider"></div>
          
          <button onClick={handleLogout} className="navbar-mobile-logout">
            <Icons.Logout />
            <span>Déconnexion</span>
          </button>
        </div>
      </nav>
      
      {/* Overlay pour le menu mobile */}
      {mobileMenuOpen && (
        <div 
          className="navbar-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
