import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, auditAPI, authAPI } from '../services/api';
import authService from '../services/authService';
import cacheService, { CACHE_KEYS } from '../services/cacheService';
import usePageTitle from '../hooks/usePageTitle';

function Dashboard() {
  usePageTitle('Tableau de bord');
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    recentLogs: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [filteredActivity, setFilteredActivity] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityFilters, setActivityFilters] = useState({
    status: '',
    search: ''
  });
  const user = authService.getUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Vérifier le cache pour les stats du dashboard
      const cachedStats = cacheService.get(CACHE_KEYS.DASHBOARD_STATS);
      if (cachedStats) {
        setStats(cachedStats.stats);
        setRecentActivity(cachedStats.activity || []);
        setFilteredActivity(cachedStats.activity || []);
        setSessions(cachedStats.sessions || []);
        setApiKeys(cachedStats.apiKeys || []);
        setTwoFactorEnabled(cachedStats.twoFactorEnabled || false);
        setUserProfile(cachedStats.userProfile || null);
        setLoading(false);
        return;
      }

      // Charger le profil utilisateur pour tous
      let profileData = null;
      try {
        const profileResponse = await userAPI.getMe();
        profileData = profileResponse.data.data;
        setUserProfile(profileData);
      } catch (e) {
        console.error('Error loading profile:', e);
      }

      // Charger les sessions actives
      let sessionsData = [];
      try {
        const sessionsResponse = await authAPI.get('/account/sessions');
        sessionsData = sessionsResponse.data.data || [];
        setSessions(sessionsData);
      } catch (e) {
        console.error('Error loading sessions:', e);
      }

      // Charger le statut 2FA
      let twoFAData = false;
      try {
        const twoFAResponse = await authAPI.get('/account/2fa/status');
        twoFAData = twoFAResponse.data.data === true;
        setTwoFactorEnabled(twoFAData);
      } catch (e) {
        console.error('Error loading 2FA status:', e);
      }

      // Charger les clés API
      let apiKeysData = [];
      try {
        const apiKeysResponse = await authAPI.get('/account/api-keys');
        apiKeysData = apiKeysResponse.data.data || [];
        setApiKeys(apiKeysData);
      } catch (e) {
        console.error('Error loading API keys:', e);
      }

      let statsData = { totalUsers: 0, activeUsers: 0, recentLogs: 0 };
      let activityData = [];

      // Charger les utilisateurs si autorisé
      if (authService.hasAnyRole(['ADMIN', 'MANAGER'])) {
        const usersResponse = await userAPI.getAll(0, 1000);
        const users = usersResponse.data.data.content;
        statsData.totalUsers = users.length;
        statsData.activeUsers = users.filter(u => u.enabled).length;
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.enabled).length,
        }));
      }

      // Charger les logs récents
      if (authService.hasAnyRole(['ADMIN', 'SECURITY'])) {
        const logsResponse = await auditAPI.getRecent(user.username);
        activityData = logsResponse.data.data;
        setRecentActivity(activityData);
        setFilteredActivity(activityData);
        statsData.recentLogs = activityData.length;
        setStats(prev => ({
          ...prev,
          recentLogs: logsResponse.data.data.length,
        }));
      }

      // Mettre en cache toutes les données du dashboard (2 minutes)
      cacheService.set(CACHE_KEYS.DASHBOARD_STATS, {
        stats: statsData,
        activity: activityData,
        sessions: sessionsData,
        apiKeys: apiKeysData,
        twoFactorEnabled: twoFAData,
        userProfile: profileData
      }, 2 * 60 * 1000);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour filtrer les activités
  const handleFilterActivity = () => {
    let filtered = [...recentActivity];
    
    if (activityFilters.search) {
      const searchLower = activityFilters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.username?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.ipAddress?.toLowerCase().includes(searchLower)
      );
    }
    
    if (activityFilters.status !== '') {
      const isSuccess = activityFilters.status === 'true';
      filtered = filtered.filter(log => log.success === isSuccess);
    }
    
    setFilteredActivity(filtered);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setActivityFilters({ status: '', search: '' });
    setFilteredActivity(recentActivity);
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (recentActivity.length > 0) {
      handleFilterActivity();
    }
  }, [activityFilters, recentActivity]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header avec icône */}
      <div className="page-header-box">
        <div className="page-header-icon dashboard">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Bienvenue, {user.firstName} {user.lastName}</p>
        </div>
        <div className="page-header-badges">
          {user.roles?.map(role => (
            <span key={role} className="badge badge-secondary">{role}</span>
          ))}
        </div>
      </div>

      {authService.hasAnyRole(['ADMIN', 'MANAGER']) && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total utilisateurs</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-label">Utilisateurs actifs</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon activity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.recentLogs}</div>
              <div className="stat-label">Activités récentes</div>
            </div>
          </div>
        </div>
      )}

      {authService.hasRole('ADMIN') && recentActivity.length > 0 && (
        <div className="content-card">
          <div className="content-card-header">
            <div className="content-card-title">
              <div className="content-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h2>Filtres de recherche</h2>
            </div>
          </div>
          <div className="content-card-body">
            <div className="flex gap-2 items-end flex-wrap-mobile">
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Recherche globale</label>
                <div style={{ position: 'relative' }}>
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="var(--text-muted)" 
                    strokeWidth="2"
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    className="form-input"
                    value={activityFilters.search}
                    onChange={(e) => setActivityFilters({ ...activityFilters, search: e.target.value })}
                    placeholder="Rechercher..."
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ minWidth: '120px' }}>
                <label className="form-label">Statut</label>
                <select
                  className="form-select"
                  value={activityFilters.status}
                  onChange={(e) => setActivityFilters({ ...activityFilters, status: e.target.value })}
                >
                  <option value="">Tous</option>
                  <option value="true">Succès</option>
                  <option value="false">Échec</option>
                </select>
              </div>
              <button 
                type="button" 
                onClick={handleResetFilters} 
                className="btn btn-secondary btn-icon-only-mobile"
                style={{ height: '42px' }}
                title="Réinitialiser"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <span className="btn-text">Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {authService.hasAnyRole(['ADMIN', 'SECURITY']) && recentActivity.length > 0 && (
        <div className="content-card">
          <div className="content-card-header">
            <div className="content-card-title">
              <div className="content-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2>Activité récente</h2>
            </div>
            <span className="content-card-badge">{filteredActivity.length} / {recentActivity.length} entrée(s)</span>
          </div>
          <div className="table-container">
            <table className="table table-striped table-responsive">
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>ACTION</th>
                  <th className="hide-tablet">DETAILS</th>
                  <th className="hide-mobile">IP ADDRESS</th>
                  <th>STATUS</th>
                  <th className="hide-mobile">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.5 }}>
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Aucun résultat avec ces filtres
                    </td>
                  </tr>
                ) : (
                  filteredActivity.slice(0, 10).map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-info">{log.username || '-'}</td>
                      <td className="font-semibold">{log.action}</td>
                      <td className="text-secondary hide-tablet">{log.details || '-'}</td>
                      <td className="font-mono text-muted hide-mobile">{log.ipAddress || '-'}</td>
                      <td>
                        <span className={`badge ${log.success ? 'badge-success' : 'badge-danger'}`}>
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="font-mono text-muted hide-mobile">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section Sécurité du compte - pour SECURITY et utilisateurs normaux */}
      {(authService.hasRole('SECURITY') || !authService.hasAnyRole(['ADMIN', 'MANAGER'])) && (
        <>
          <div className="dashboard-user-grid">
            {/* Carte 2FA */}
            <div className="content-card security-card">
              <div className="content-card-header">
                <div className="content-card-title">
                  <div className="content-card-icon" style={{ 
                    background: twoFactorEnabled 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.25))' 
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.25))',
                    border: twoFactorEnabled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={twoFactorEnabled ? 'var(--color-success)' : 'var(--color-warning)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      {twoFactorEnabled && <path d="M9 12l2 2 4-4"/>}
                      {!twoFactorEnabled && <>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </>}
                    </svg>
                  </div>
                  <h2>Authentification 2FA</h2>
                </div>
                <span className={`badge ${twoFactorEnabled ? 'badge-success' : 'badge-warning'}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontWeight: '500'
                }}>
                  {twoFactorEnabled ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Activé
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Désactivé
                    </>
                  )}
                </span>
              </div>
              <div className="content-card-body">
                {twoFactorEnabled ? (
                  <div className="security-status-box success">
                    <div className="security-status-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="security-status-title">Votre compte est protégé</p>
                      <p className="security-status-desc">L'authentification à deux facteurs est active sur votre compte.</p>
                    </div>
                  </div>
                ) : (
                  <div className="security-status-box warning">
                    <div className="security-status-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <div>
                      <p className="security-status-title">Protégez votre compte</p>
                      <p className="security-status-desc">Activez l'authentification 2FA pour renforcer la sécurité de votre compte.</p>
                    </div>
                  </div>
                )}
                <button 
                  className={`btn ${twoFactorEnabled ? 'btn-secondary' : 'btn-primary'} btn-block mt-3`}
                  onClick={() => navigate('/account/security?section=2fa')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontWeight: '500'
                  }}
                >
                  {twoFactorEnabled ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Gérer la 2FA
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M12 8v4"/>
                        <path d="M12 16h.01"/>
                      </svg>
                      Activer la 2FA maintenant
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Carte Mot de passe */}
            <div className="content-card security-card">
              <div className="content-card-header">
                <div className="content-card-title">
                  <div className="content-card-icon" style={{ 
                    background: user?.mustChangePassword 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.25))' 
                      : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.25))',
                    border: user?.mustChangePassword ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={user?.mustChangePassword ? 'var(--color-warning)' : 'var(--color-success)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      {!user?.mustChangePassword && <path d="M12 15v2"/>}
                    </svg>
                  </div>
                  <h2>Mot de passe</h2>
                </div>
                <span className={`badge ${user?.mustChangePassword ? 'badge-warning' : 'badge-success'}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontWeight: '500'
                }}>
                  {user?.mustChangePassword ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      À changer
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Sécurisé
                    </>
                  )}
                </span>
              </div>
              <div className="content-card-body">
                {user?.mustChangePassword ? (
                  <div className="security-status-box warning">
                    <div className="security-status-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="security-status-title">Changement recommandé</p>
                      <p className="security-status-desc">Vous utilisez un mot de passe temporaire. Créez votre propre mot de passe.</p>
                    </div>
                  </div>
                ) : (
                  <div className="security-status-box success">
                    <div className="security-status-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        <circle cx="12" cy="16" r="1"/>
                      </svg>
                    </div>
                    <div>
                      <p className="security-status-title">Mot de passe personnel</p>
                      <p className="security-status-desc">Vous avez défini votre propre mot de passe sécurisé.</p>
                    </div>
                  </div>
                )}
                <button 
                  className={`btn ${user?.mustChangePassword ? 'btn-primary' : 'btn-secondary'} btn-block mt-3`}
                  onClick={() => navigate('/account/security?section=password')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontWeight: '500'
                  }}
                >
                  {user?.mustChangePassword ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                      Changer maintenant
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Modifier le mot de passe
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Carte Sessions */}
            <div className="content-card security-card">
              <div className="content-card-header">
                <div className="content-card-title">
                  <div className="content-card-icon" style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.25))',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <h2>Sessions actives</h2>
                </div>
                <span className="badge badge-info" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontWeight: '500'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2"/>
                    <path d="M12 20v2"/>
                    <path d="m4.93 4.93 1.41 1.41"/>
                    <path d="m17.66 17.66 1.41 1.41"/>
                    <path d="M2 12h2"/>
                    <path d="M20 12h2"/>
                    <path d="m6.34 17.66-1.41 1.41"/>
                    <path d="m19.07 4.93-1.41 1.41"/>
                  </svg>
                  {sessions.length} session(s)
                </span>
              </div>
              <div className="content-card-body">
                <div className="security-status-box info">
                  <div className="security-status-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <path d="M8 21h8"/>
                      <path d="M12 17v4"/>
                      <circle cx="12" cy="10" r="2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="security-status-title">{sessions.length} appareil(s) connecté(s)</p>
                    <p className="security-status-desc">Gérez vos sessions actives et déconnectez les appareils non reconnus.</p>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-block mt-3"
                  onClick={() => navigate('/account/security?section=sessions')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontWeight: '500'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <path d="M8 21h8"/>
                    <path d="M12 17v4"/>
                  </svg>
                  Gérer les sessions
                </button>
              </div>
            </div>

            {/* Carte Clés API - dans la même grille que Sessions */}
            <div className="content-card security-card">
              <div className="content-card-header">
                <div className="content-card-title">
                  <div className="content-card-icon" style={{ 
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.25))',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </div>
                  <h2>Clés API</h2>
                </div>
                <span className={`badge ${apiKeys.filter(k => k.active).length > 0 ? 'badge-warning' : 'badge-secondary'}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontWeight: '500'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  {apiKeys.filter(k => k.active).length} clé(s) active(s)
                </span>
              </div>
              <div className="content-card-body">
                <div className={`security-status-box ${apiKeys.filter(k => k.active).length > 0 ? 'warning' : 'info'}`}>
                  <div className="security-status-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </div>
                  <div>
                    {apiKeys.filter(k => k.active).length > 0 ? (
                      <>
                        <p className="security-status-title">{apiKeys.filter(k => k.active).length} clé(s) API active(s)</p>
                        <p className="security-status-desc">Gérez vos clés d'accès pour les intégrations externes.</p>
                      </>
                    ) : (
                      <>
                        <p className="security-status-title">Aucune clé API active</p>
                        <p className="security-status-desc">Créez une clé API pour intégrer des services externes.</p>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-block mt-3"
                  onClick={() => navigate('/account/security?section=apikeys')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    fontWeight: '500'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  Gérer les clés API
                </button>
              </div>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="content-card">
            <div className="content-card-header">
              <div className="content-card-title">
                <div className="content-card-icon" style={{ 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.25))',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2>Informations du compte</h2>
              </div>
            </div>
            <div className="content-card-body">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Nom d'utilisateur</span>
                  <span className="profile-info-value font-mono">{user?.username}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{userProfile?.email || user?.email}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Nom complet</span>
                  <span className="profile-info-value">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Rôle(s)</span>
                  <span className="profile-info-value">
                    {user?.roles?.map(role => (
                      <span key={role} className="badge badge-info mr-1">{role}</span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conseils de sécurité - uniquement pour les utilisateurs normaux (pas SECURITY) */}
          {!authService.hasRole('SECURITY') && (
            <div className="content-card tips-card">
              <div className="content-card-header">
                <div className="content-card-title">
                  <div className="content-card-icon" style={{ 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                  </div>
                  <h2>Conseils de sécurité</h2>
                </div>
              </div>
              <div className="content-card-body">
                <div className="tips-grid">
                  <div className="tip-item">
                    <span className="tip-icon-simple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                          <linearGradient id="tip2faGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e"/>
                            <stop offset="100%" stopColor="#16a34a"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#tip2faGrad)" strokeWidth="2" fill="rgba(34, 197, 94, 0.15)"/>
                        <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2.5"/>
                      </svg>
                    </span>
                    <div>
                      <p className="tip-title">Activez la 2FA</p>
                      <p className="tip-desc">Ajoutez une couche de sécurité supplémentaire avec Google Authenticator.</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon-simple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                          <linearGradient id="tipLockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6"/>
                            <stop offset="100%" stopColor="#2563eb"/>
                          </linearGradient>
                        </defs>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="url(#tipLockGrad)" strokeWidth="2" fill="rgba(59, 130, 246, 0.15)"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#3b82f6" strokeWidth="2"/>
                        <circle cx="12" cy="16" r="1.5" fill="#3b82f6"/>
                        <path d="M12 17.5v1" stroke="#3b82f6" strokeWidth="2"/>
                      </svg>
                    </span>
                    <div>
                      <p className="tip-title">Mot de passe fort</p>
                      <p className="tip-desc">Utilisez un mot de passe unique avec des caractères spéciaux.</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon-simple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                          <linearGradient id="tipEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6"/>
                            <stop offset="100%" stopColor="#7c3aed"/>
                          </linearGradient>
                        </defs>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="url(#tipEyeGrad)" strokeWidth="2" fill="rgba(139, 92, 246, 0.15)"/>
                        <circle cx="12" cy="12" r="3" stroke="#8b5cf6" strokeWidth="2" fill="rgba(139, 92, 246, 0.3)"/>
                        <circle cx="12" cy="12" r="1" fill="#8b5cf6"/>
                      </svg>
                    </span>
                    <div>
                      <p className="tip-title">Surveillez vos sessions</p>
                      <p className="tip-desc">Vérifiez régulièrement les appareils connectés à votre compte.</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon-simple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                          <linearGradient id="tipLogoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b"/>
                            <stop offset="100%" stopColor="#d97706"/>
                          </linearGradient>
                        </defs>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="url(#tipLogoutGrad)" strokeWidth="2"/>
                        <rect x="3" y="3" width="8" height="18" rx="2" fill="rgba(245, 158, 11, 0.15)" stroke="none"/>
                        <polyline points="16 17 21 12 16 7" stroke="#f59e0b" strokeWidth="2.5"/>
                        <line x1="21" y1="12" x2="9" y2="12" stroke="#f59e0b" strokeWidth="2"/>
                      </svg>
                    </span>
                    <div>
                      <p className="tip-title">Déconnectez-vous</p>
                      <p className="tip-desc">Toujours vous déconnecter sur les appareils partagés.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
