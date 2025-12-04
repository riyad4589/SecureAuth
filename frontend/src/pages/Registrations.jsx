import { useState, useEffect } from 'react';
import { registrationAPI } from '../services/api';
import { useToast } from '../components/Toast';
import PasswordModal from '../components/PasswordModal';
import usePageTitle from '../hooks/usePageTitle';

function Registrations() {
  usePageTitle('Demandes d\'inscription');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'pending'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [passwordModalData, setPasswordModalData] = useState({ isOpen: false, password: '', username: '' });
  const toast = useToast();

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const response = filter === 'pending'
        ? await registrationAPI.getPending()
        : await registrationAPI.getAll();
      setRequests(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes', {
        title: 'Erreur de chargement',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await registrationAPI.approve(selectedRequest.id, comment);
      const tempPassword = response.data.data.temporaryPassword;
      const username = response.data.data.username;
      
      // Afficher le modal avec le mot de passe
      setPasswordModalData({
        isOpen: true,
        password: tempPassword,
        username: username
      });
      
      setShowModal(false);
      setComment('');
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'approbation', {
        title: 'Échec de l\'approbation',
        icon: 'error'
      });
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;

    try {
      await registrationAPI.reject(selectedRequest.id, comment);
      toast.warning(`La demande de ${selectedRequest.firstName} ${selectedRequest.lastName} a été rejetée`, {
        title: '❌ Demande rejetée',
        icon: 'error'
      });
      setShowModal(false);
      setComment('');
      loadRequests();
    } catch (error) {
      toast.error('Erreur lors du rejet', {
        title: 'Échec du rejet',
        icon: 'error'
      });
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setComment('');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { class: 'badge-warning', text: 'PENDING' },
      APPROVED: { class: 'badge-success', text: 'APPROVED' },
      REJECTED: { class: 'badge-danger', text: 'REJECTED' },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading registrations...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header avec icône */}
      <div className="page-header-box">
        <div className="page-header-icon registrations">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Demandes d'inscription</h1>
          <p className="page-subtitle">Évaluez et approuvez les demandes d'inscription</p>
        </div>
        <div className="page-header-actions">
          <div className="btn-group">
            <button
              onClick={() => setFilter('pending')}
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              En attente ({requests.filter(r => r.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Toutes
            </button>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-title">
            <div className="content-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
              </svg>
            </div>
            <h2>Liste des demandes</h2>
          </div>
          <span className="content-card-badge">{requests.length} demande(s)</span>
        </div>
        <div className="table-container">
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3>Aucune demande</h3>
              <p>Aucune demande {filter === 'pending' ? 'en attente ' : ''}trouvée.</p>
            </div>
          ) : (
          <table className="table table-striped table-responsive">
            <thead>
              <tr>
                <th className="hide-mobile">DATE</th>
                <th>NOM COMPLET</th>
                <th className="hide-tablet">EMAIL</th>
                <th className="hide-mobile">ENTREPRISE</th>
                <th>STATUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="font-mono text-sm hide-mobile">
                    {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <span className="text-cyber-green font-mono">
                      {request.firstName} {request.lastName}
                    </span>
                  </td>
                  <td className="text-muted hide-tablet">{request.email}</td>
                  <td className="hide-mobile">{request.companyName}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>
                    <button
                      onClick={() => openModal(request)}
                      className="btn btn-sm btn-primary"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            {/* Header amélioré avec icône et statut */}
            <div className="modal-header" style={{ 
              borderBottom: '1px solid var(--border-primary)',
              paddingBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: selectedRequest.status === 'PENDING' 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))'
                    : selectedRequest.status === 'APPROVED'
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                  border: selectedRequest.status === 'PENDING'
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : selectedRequest.status === 'APPROVED'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                    stroke={selectedRequest.status === 'PENDING' ? '#f59e0b' : selectedRequest.status === 'APPROVED' ? '#22c55e' : '#ef4444'} 
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    {selectedRequest.status === 'PENDING' && (
                      <>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </>
                    )}
                    {selectedRequest.status === 'APPROVED' && <polyline points="17 8 19 10 23 6"/>}
                    {selectedRequest.status === 'REJECTED' && (
                      <>
                        <line x1="17" y1="8" x2="23" y2="14"/>
                        <line x1="23" y1="8" x2="17" y2="14"/>
                      </>
                    )}
                  </svg>
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>Détails de la demande</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Demande #{selectedRequest.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon" style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {/* Section Informations personnelles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Informations personnelles
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid var(--border-primary)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nom complet</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                      {selectedRequest.firstName} {selectedRequest.lastName}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{selectedRequest.email}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Téléphone</span>
                    <span>{selectedRequest.phoneNumber || <span style={{ color: 'var(--text-muted)' }}>Non renseigné</span>}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Entreprise</span>
                    <span style={{ fontWeight: '500' }}>{selectedRequest.companyName}</span>
                  </div>
                </div>
              </div>

              {/* Section Motif de la demande */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Motif de la demande
                </h3>
                <div style={{ 
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid var(--border-primary)',
                  minHeight: '60px'
                }}>
                  {selectedRequest.requestReason || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun motif spécifié</span>}
                </div>
              </div>

              {/* Section Métadonnées */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Informations de la demande
                </h3>
                <div style={{ 
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    flex: '1',
                    minWidth: '150px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid var(--border-primary)',
                    textAlign: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" style={{ marginBottom: '8px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Date de demande</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: '500' }}>
                      {new Date(selectedRequest.requestedAt).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(selectedRequest.requestedAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div style={{
                    flex: '1',
                    minWidth: '150px',
                    background: selectedRequest.status === 'PENDING' 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
                      : selectedRequest.status === 'APPROVED'
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: selectedRequest.status === 'PENDING'
                      ? '1px solid rgba(245, 158, 11, 0.3)'
                      : selectedRequest.status === 'APPROVED'
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center'
                  }}>
                    {selectedRequest.status === 'PENDING' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ marginBottom: '8px' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    ) : selectedRequest.status === 'APPROVED' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ marginBottom: '8px' }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginBottom: '8px' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Statut</div>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>
              </div>
              
              {/* Section Traitement (si traité) */}
              {selectedRequest.processedAt && (
                <div style={{ 
                  background: selectedRequest.status === 'APPROVED' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: selectedRequest.status === 'APPROVED'
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <h3 style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    color: selectedRequest.status === 'APPROVED' ? '#22c55e' : '#ef4444',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {selectedRequest.status === 'APPROVED' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                    {selectedRequest.status === 'APPROVED' ? 'Demande approuvée' : 'Demande rejetée'}
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Traité le</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: '500' }}>
                        {new Date(selectedRequest.processedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Par</span>
                      <span style={{ fontWeight: '500', color: 'var(--color-info)' }}>{selectedRequest.processedBy}</span>
                    </div>
                    {selectedRequest.adminComment && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-primary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Commentaire</span>
                            <span style={{ fontSize: '0.875rem' }}>{selectedRequest.adminComment}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section Actions pour demandes en attente */}
            {selectedRequest.status === 'PENDING' && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    className="form-textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                    placeholder="Ajoutez un commentaire pour cette décision..."
                    style={{
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div className="modal-footer" style={{ 
                  padding: 0,
                  borderTop: '1px solid var(--border-primary)',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Fermer
                  </button>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleReject} className="btn btn-danger" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Rejeter
                    </button>
                    <button onClick={handleApprove} className="btn btn-success" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Approuver
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer pour demandes déjà traitées */}
            {selectedRequest.status !== 'PENDING' && (
              <div className="modal-footer" style={{ 
                borderTop: '1px solid var(--border-primary)',
                padding: '1rem 1.5rem'
              }}>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: 'auto'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Mot de passe temporaire */}
      <PasswordModal
        isOpen={passwordModalData.isOpen}
        onClose={() => setPasswordModalData({ ...passwordModalData, isOpen: false })}
        password={passwordModalData.password}
        username={passwordModalData.username}
        type="create"
      />
    </div>
  );
}

export default Registrations;
