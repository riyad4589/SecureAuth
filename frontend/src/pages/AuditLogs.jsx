import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';

function AuditLogs() {
  usePageTitle('Journaux d\'audit');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    success: '',
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      const response = await auditAPI.getAll(page, 20);
      setLogs(response.data.data.content);
      setFilteredLogs(response.data.data.content);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour filtrer les logs localement
  const applyFilters = () => {
    let filtered = [...logs];
    
    // Filtre de recherche globale
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.username?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.ipAddress?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par statut
    if (filters.success !== '') {
      const isSuccess = filters.success === 'true';
      filtered = filtered.filter(log => log.success === isSuccess);
    }
    
    setFilteredLogs(filtered);
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (logs.length > 0) {
      applyFilters();
    }
  }, [filters, logs]);

  const handleReset = () => {
    setFilters({ search: '', success: '' });
    setFilteredLogs(logs);
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('LOGIN')) return 'badge-info';
    if (action.includes('CREATED')) return 'badge-success';
    if (action.includes('DELETED')) return 'badge-danger';
    if (action.includes('UPDATED')) return 'badge-warning';
    return 'badge-secondary';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading audit logs...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header avec icône */}
      <div className="page-header-box">
        <div className="page-header-icon audit">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Journal d'audit</h1>
          <p className="page-subtitle">Trace de sécurité et surveillance des activités</p>
        </div>
      </div>

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
          {(filters.search || filters.success) && (
            <span className="content-card-badge" style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
              color: 'var(--color-info)'
            }}>
              {filteredLogs.length} / {logs.length} résultat(s)
            </span>
          )}
        </div>
        <div className="content-card-body">
          <div className="flex gap-2 items-end flex-row-mobile-col">
            <div className="form-group" style={{ flex: 1 }}>
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
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Rechercher..."
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="form-group" style={{ minWidth: '120px' }}>
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={filters.success}
                onChange={(e) => setFilters({ ...filters, success: e.target.value })}
              >
                <option value="">Tous</option>
                <option value="true">Succès</option>
                <option value="false">Échec</option>
              </select>
            </div>
            <button 
              type="button" 
              onClick={handleReset} 
              className="btn btn-secondary btn-icon"
              style={{ height: '42px' }}
              title="Réinitialiser"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-title">
            <div className="content-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2>Résultats</h2>
          </div>
          <div className="content-card-actions">
            <span className="content-card-badge">{filteredLogs.length} entrée(s)</span>
            <div className="btn-group">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-sm btn-secondary"
            >
              ← Précédent
            </button>
            <span className="pagination-info">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn btn-sm btn-secondary"
            >
              Suivant →
            </button>
          </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>DATE</th>
                <th>UTILISATEUR</th>
                <th>ACTION</th>
                <th className="hide-tablet">DÉTAILS</th>
                <th className="hide-mobile">IP</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
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
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-sm" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('fr-FR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td>
                      <span className="text-cyber-green font-mono">{log.username}</span>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-muted text-truncate hide-tablet" style={{ maxWidth: '200px' }}>
                      {log.details || '-'}
                    </td>
                    <td className="font-mono text-sm text-muted hide-mobile">
                      {log.ipAddress || '-'}
                    </td>
                    <td>
                      <span className={`badge ${log.success ? 'badge-success' : 'badge-danger'}`}>
                        {log.success ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
