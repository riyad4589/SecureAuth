import { useState, useEffect } from 'react';
import { userAPI, roleAPI } from '../services/api';
import authService from '../services/authService';
import { useToast } from '../components/Toast';
import PasswordModal from '../components/PasswordModal';
import cacheService, { CACHE_KEYS } from '../services/cacheService';
import usePageTitle from '../hooks/usePageTitle';

function Users() {
  usePageTitle('Utilisateurs');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordModalData, setPasswordModalData] = useState({ isOpen: false, password: '', username: '', type: 'create' });
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roles: ['USER'],
  });
  const toast = useToast();

  // Détecter si l'utilisateur connecté est un manager
  const currentUser = authService.getUser();
  const isManager = currentUser?.roles?.includes('MANAGER') && !currentUser?.roles?.includes('ADMIN');

  // Rôle USER par défaut pour le manager
  const defaultUserRole = { id: 'user-role', name: 'USER', description: 'Utilisateur standard' };

  // Filtrer les rôles disponibles pour le manager (seulement USER)
  const availableRoles = isManager 
    ? (roles.find(role => role.name === 'USER') ? roles.filter(role => role.name === 'USER') : [defaultUserRole])
    : roles;

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async (forceRefresh = false) => {
    try {
      // Vérifier le cache d'abord
      const cacheKey = isManager ? `${CACHE_KEYS.USERS}_manager` : CACHE_KEYS.USERS;
      if (!forceRefresh) {
        const cachedUsers = cacheService.get(cacheKey);
        if (cachedUsers) {
          setUsers(cachedUsers);
          setLoading(false);
          return;
        }
      }

      const response = await userAPI.getAll(0, 100);
      let usersList = response.data.data.content;
      
      // Filtrer les utilisateurs ADMIN si le manager consulte la liste
      if (isManager) {
        usersList = usersList.filter(user => {
          const userRoles = Array.isArray(user.roles) ? user.roles : Array.from(user.roles || []);
          return !userRoles.some(role => 
            (typeof role === 'string' ? role : role?.name) === 'ADMIN'
          );
        });
      }
      
      // Mettre en cache
      cacheService.set(cacheKey, usersList);
      setUsers(usersList);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs', {
        title: 'Erreur de chargement',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async (forceRefresh = false) => {
    try {
      // Vérifier le cache d'abord
      if (!forceRefresh) {
        const cachedRoles = cacheService.get(CACHE_KEYS.ROLES);
        if (cachedRoles) {
          setRoles(cachedRoles);
          return;
        }
      }

      const response = await roleAPI.getAll();
      const rolesData = response.data.data;
      cacheService.set(CACHE_KEYS.ROLES, rolesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await userAPI.create(formData);
      console.log('API Response:', response.data);
      const tempPassword = response.data.data.temporaryPassword;
      const userData = response.data.data.user || response.data.data;
      const username = userData?.username || userData?.email || formData.email;
      
      // Afficher le modal avec le mot de passe
      setPasswordModalData({
        isOpen: true,
        password: tempPassword,
        username: username,
        type: 'create'
      });
      
      setShowModal(false);
      resetForm();
      cacheService.invalidateByPrefix(CACHE_KEYS.USERS);
      loadUsers(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création', {
        title: 'Échec de création',
        icon: 'error'
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userAPI.update(selectedUser.id, formData);
      toast.success('Les informations ont été mises à jour', {
        title: '✅ Utilisateur modifié',
        icon: 'user'
      });
      setShowModal(false);
      resetForm();
      cacheService.invalidateByPrefix(CACHE_KEYS.USERS);
      loadUsers(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour', {
        title: 'Échec de la modification',
        icon: 'error'
      });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await userAPI.delete(id);
      toast.success('L\'utilisateur a été supprimé définitivement', {
        title: '🗑️ Utilisateur supprimé',
        icon: 'trash'
      });
      cacheService.invalidateByPrefix(CACHE_KEYS.USERS);
      loadUsers(true);
    } catch (error) {
      toast.error('Impossible de supprimer cet utilisateur', {
        title: 'Échec de la suppression',
        icon: 'error'
      });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await userAPI.toggleStatus(id);
      toast.success('Le statut du compte a été modifié', {
        title: '🔄 Statut mis à jour',
        icon: 'user'
      });
      cacheService.invalidateByPrefix(CACHE_KEYS.USERS);
      loadUsers(true);
    } catch (error) {
      toast.error('Impossible de modifier le statut', {
        title: 'Erreur',
        icon: 'error'
      });
    }
  };

  const handleResetPassword = async (id, username) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${username} ?`)) return;
    
    try {
      const response = await userAPI.resetPassword(id);
      const newPassword = response.data.data.temporaryPassword;
      
      // Afficher le modal avec le nouveau mot de passe
      setPasswordModalData({
        isOpen: true,
        password: newPassword,
        username: username,
        type: 'reset'
      });
      
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation', {
        title: 'Échec de la réinitialisation',
        icon: 'error'
      });
    }
  };

  const handleUnlock = async (id) => {
    try {
      await userAPI.unlock(id);
      toast.success('Le compte a été déverrouillé avec succès', {
        title: '🔓 Compte déverrouillé',
        icon: 'unlock'
      });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de déverrouiller le compte', {
        title: 'Échec du déverrouillage',
        icon: 'error'
      });
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      roles: Array.from(user.roles),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roles: ['USER'],
    });
    setSelectedUser(null);
  };

  if (loading) return (
    <div className="page-container">
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading users...
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header avec icône */}
      <div className="page-header-box">
        <div className="page-header-icon users">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">Gérez les comptes, rôles et permissions</p>
        </div>
        <div className="page-header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-title">
            <div className="content-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <h2>Liste des utilisateurs</h2>
          </div>
          <span className="content-card-badge">{users.length} utilisateur(s)</span>
        </div>
        <div className="table-container">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th className="hide-mobile">NOM COMPLET</th>
                <th className="hide-tablet">EMAIL</th>
                <th className="hide-mobile">RÔLES</th>
                <th>STATUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <span className="font-mono text-success font-semibold">{user.username}</span>
                      <div className="show-mobile text-xs text-secondary" style={{display: 'none'}}>
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile">{user.firstName} {user.lastName}</td>
                  <td className="text-secondary hide-tablet">{user.email}</td>
                  <td className="hide-mobile">
                    <div className="flex gap-1 flex-wrap">
                      {Array.from(user.roles).map(role => (
                        <span key={role} className="badge badge-info">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <span className={`badge ${user.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {user.enabled ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {!user.accountNonLocked && (
                        <span className="badge badge-warning">LOCKED</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 actions-cell">
                      <button 
                        onClick={() => openEditModal(user)} 
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Modifier"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(user.id)} 
                        className={`btn btn-sm btn-icon ${user.enabled ? 'btn-ghost' : 'btn-success'}`}
                        title={user.enabled ? 'Désactiver' : 'Activer'}
                      >
                        {user.enabled ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        )}
                      </button>
                      {!user.accountNonLocked && (
                        <button 
                          onClick={() => handleUnlock(user.id)} 
                          className="btn btn-success btn-sm btn-icon"
                          title="Déverrouiller"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                          </svg>
                        </button>
                      )}
                      {!isManager && (
                        <button 
                          onClick={() => handleResetPassword(user.id, user.username)} 
                          className="btn btn-warning btn-sm btn-icon"
                          title="Réinitialiser le mot de passe"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                          </svg>
                        </button>
                      )}
                      {!isManager && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          className="btn btn-danger btn-sm btn-icon"
                          title="Supprimer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <div className={`modal-icon ${modalMode === 'create' ? 'create' : 'edit'}`}>
                  {modalMode === 'create' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
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
                    {modalMode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
                  </h2>
                  <p className="modal-subtitle">
                    {modalMode === 'create' 
                      ? 'Remplissez les informations pour créer un nouveau compte' 
                      : 'Modifiez les informations de l\'utilisateur'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="modal-close-btn"
                aria-label="Fermer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={modalMode === 'create' ? handleCreateUser : handleUpdateUser}>
              <div className="modal-body">
                {/* Section Informations de contact */}
                <div className="form-section">
                  <div className="form-section-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Informations de contact</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Adresse email</label>
                    <div className="input-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="utilisateur@exemple.com"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Téléphone <span className="form-optional">(optionnel)</span></label>
                    <div className="input-with-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Identité */}
                <div className="form-section">
                  <div className="form-section-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Identité</span>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Prénom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        placeholder="Jean"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Rôles */}
                <div className="form-section">
                  <div className="form-section-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Rôle</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Attribuer un rôle</label>
                    <div className="roles-grid">
                      {availableRoles.map(role => (
                        <label key={role.id} className={`role-checkbox ${formData.roles.includes(role.name) ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="user-role"
                            checked={formData.roles.includes(role.name)}
                            onChange={() => {
                              setFormData({ ...formData, roles: [role.name] });
                            }}
                          />
                          <span className="role-checkbox-indicator">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </span>
                          <span className="role-checkbox-label">{role.name}</span>
                          {role.description && (
                            <span className="role-checkbox-desc">{role.description}</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <span className="form-help">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      Sélectionnez le rôle de cet utilisateur
                    </span>
                  </div>
                </div>
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
                  {modalMode === 'create' ? 'Créer l\'utilisateur' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mot de passe temporaire */}
      <PasswordModal
        isOpen={passwordModalData.isOpen}
        onClose={() => setPasswordModalData({ ...passwordModalData, isOpen: false })}
        password={passwordModalData.password}
        username={passwordModalData.username}
        type={passwordModalData.type}
      />
    </div>
  );
}

export default Users;
