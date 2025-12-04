import { useState, useEffect } from 'react';
import { roleAPI } from '../services/api';
import { useToast } from '../components/Toast';
import cacheService, { CACHE_KEYS } from '../services/cacheService';
import usePageTitle from '../hooks/usePageTitle';

function Roles() {
  usePageTitle('Rôles');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const toast = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async (forceRefresh = false) => {
    try {
      // Vérifier le cache
      if (!forceRefresh) {
        const cachedRoles = cacheService.get(CACHE_KEYS.ROLES);
        if (cachedRoles) {
          setRoles(cachedRoles);
          setLoading(false);
          return;
        }
      }

      const response = await roleAPI.getAll();
      const rolesData = response.data.data;
      cacheService.set(CACHE_KEYS.ROLES, rolesData);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Erreur lors du chargement des rôles', {
        title: 'Erreur de chargement',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await roleAPI.create(formData);
      toast.success(`Rôle "${formData.name}" créé avec succès`, {
        title: '✨ Nouveau rôle',
        icon: 'role'
      });
      setShowModal(false);
      resetForm();
      cacheService.delete(CACHE_KEYS.ROLES);
      loadRoles(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création', {
        title: 'Échec de création',
        icon: 'error'
      });
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await roleAPI.update(selectedRole.id, formData);
      toast.success('Le rôle a été mis à jour', {
        title: '✅ Rôle modifié',
        icon: 'role'
      });
      setShowModal(false);
      resetForm();
      cacheService.delete(CACHE_KEYS.ROLES);
      loadRoles(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour', {
        title: 'Échec de la modification',
        icon: 'error'
      });
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;
    
    try {
      await roleAPI.delete(id);
      toast.success('Le rôle a été supprimé', {
        title: '🗑️ Rôle supprimé',
        icon: 'trash'
      });
      cacheService.delete(CACHE_KEYS.ROLES);
      loadRoles(true);
    } catch (error) {
      toast.error('Impossible de supprimer ce rôle', {
        title: 'Échec de la suppression',
        icon: 'error'
      });
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setModalMode('edit');
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setSelectedRole(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading roles...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header avec icône */}
      <div className="page-header-box">
        <div className="page-header-icon roles">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Gestion des rôles</h1>
          <p className="page-subtitle">Gérez les rôles et permissions du système</p>
        </div>
        <div className="page-header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau rôle
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-title">
            <div className="content-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2>Liste des rôles</h2>
          </div>
          <span className="content-card-badge">{roles.length} rôle(s)</span>
        </div>
        <div className="table-container">
        <table className="table table-striped table-responsive">
          <thead>
            <tr>
              <th>NAME</th>
              <th className="hide-mobile">DESCRIPTION</th>
              <th className="hide-tablet">PERMISSIONS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <span className="text-cyber-green font-mono">{role.name}</span>
                </td>
                <td className="text-muted hide-mobile">{role.description || '-'}</td>
                <td className="hide-tablet">
                  {role.permissions && role.permissions.size > 0 ? (
                    <span className="badge badge-info">
                      {Array.from(role.permissions).length} permissions
                    </span>
                  ) : (
                    <span className="badge badge-warning">None</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${role.active ? 'badge-success' : 'badge-danger'}`}>
                    {role.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td>
                  <div className="btn-group btn-group-responsive">
                    <button onClick={() => openEditModal(role)} className="btn btn-sm btn-primary btn-icon-only-mobile" title="Modifier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <span className="btn-text">Edit</span>
                    </button>
                    <button onClick={() => handleDeleteRole(role.id)} className="btn btn-sm btn-danger btn-icon-only-mobile" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-svg">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span className="btn-text">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <div className={`modal-icon ${modalMode === 'create' ? 'create' : 'edit'}`}>
                  {modalMode === 'create' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <line x1="12" y1="8" x2="12" y2="14"/>
                      <line x1="9" y1="11" x2="15" y2="11"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="modal-title">
                    {modalMode === 'create' ? 'Créer un rôle' : 'Modifier le rôle'}
                  </h2>
                  <p className="modal-subtitle">
                    {modalMode === 'create' 
                      ? 'Définissez un nouveau rôle pour le système' 
                      : 'Modifiez les informations du rôle'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={modalMode === 'create' ? handleCreateRole : handleUpdateRole}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-section-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Informations du rôle</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Nom du rôle</label>
                    <div className="input-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                        required
                        placeholder="Ex: MANAGER, SUPERVISEUR"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <span className="form-help">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      Le nom sera automatiquement converti en majuscules
                    </span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Description <span className="form-optional">(optionnel)</span></label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        placeholder="Décrivez les responsabilités et permissions associées à ce rôle..."
                      />
                      <div className="textarea-counter">
                        {formData.description?.length || 0} / 500
                      </div>
                    </div>
                  </div>
                </div>

                {modalMode === 'create' && (
                  <div className="form-info-box">
                    <div className="form-info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div className="form-info-content">
                      <strong>Conseil</strong>
                      <p>Après la création, vous pourrez attribuer ce rôle aux utilisateurs depuis la page de gestion des utilisateurs.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {modalMode === 'create' ? (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </>
                    ) : (
                      <polyline points="20 6 9 17 4 12"/>
                    )}
                  </svg>
                  {modalMode === 'create' ? 'Créer le rôle' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
