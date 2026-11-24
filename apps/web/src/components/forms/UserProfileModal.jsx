import React, { useState, useMemo, useEffect } from 'react';

export function UserProfileModal({
  isOpen,
  onClose,
  user = null,
  projects = [],
  teamDirectory = [],
  workItems = [],
  onUpdateProfile
}) {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'edit'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [user, isOpen]);

  const userInitials = useMemo(() => {
    if (!user?.name) return 'JC';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [user]);

  // Directorio de este usuario
  const directoryEntry = useMemo(() => {
    if (!user) return null;
    return teamDirectory.find(
      (m) =>
        (m.email && m.email.toLowerCase() === user.email?.toLowerCase()) ||
        m.name.toLowerCase() === user.name?.toLowerCase()
    );
  }, [teamDirectory, user]);

  // Proyectos donde participa y rol específico
  const userProjects = useMemo(() => {
    if (!user) return [];
    const userName = (user.name || '').toLowerCase();
    const userEmail = (user.email || '').toLowerCase();

    return projects.map((p) => {
      let roleInProject = null;

      // 1. Verificar si es el creador o líder declarado en el proyecto
      if (p.role === 'lead' || (p.createdBy && p.createdBy.toLowerCase() === userName)) {
        roleInProject = 'Líder / Encargado';
      }

      // 2. Verificar lista de miembros del proyecto
      if (Array.isArray(p.members)) {
        const memberRecord = p.members.find(
          (m) =>
            (m.name && m.name.toLowerCase() === userName) ||
            (m.email && m.email.toLowerCase() === userEmail)
        );
        if (memberRecord) {
          if (memberRecord.role === 'lead') roleInProject = 'Líder / Encargado';
          else if (memberRecord.role === 'collaborator') roleInProject = roleInProject || 'Colaborador';
          else if (memberRecord.role === 'observer' || memberRecord.role === 'viewer') roleInProject = roleInProject || 'Observador';
          else roleInProject = roleInProject || memberRecord.role;
        }
      }

      // 3. Tareas asignadas a este usuario en este proyecto
      const myTasksInProject = workItems.filter((w) => {
        if (w.projectId !== p.id) return false;
        if (Array.isArray(w.assignees) && w.assignees.some((a) => a && a.toLowerCase() === userName)) return true;
        if (w.assignee && w.assignee.toLowerCase().includes(userName)) return true;
        return false;
      });

      if (!roleInProject && myTasksInProject.length > 0) {
        roleInProject = 'Colaborador asignado';
      }

      // Si es admin/owner global, al menos tiene rol de gestión general
      if (!roleInProject && (user.role === 'owner' || user.role === 'admin')) {
        roleInProject = 'Administrador de portafolio';
      }

      return {
        id: p.id,
        code: p.code || 'PRJ',
        name: p.name,
        role: roleInProject || 'Sin rol específico',
        taskCount: myTasksInProject.length,
        status: p.status,
        space: p.space || 'work'
      };
    });
  }, [projects, workItems, user]);

  // Proyectos activos donde colabora
  const participatingProjects = useMemo(() => {
    return userProjects.filter((p) => p.role !== 'Sin rol específico');
  }, [userProjects]);

  if (!isOpen || !user) return null;

  const isOwner = user.role === 'owner' || user.role === 'admin';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('La confirmación de la contraseña no coincide');
        return;
      }
      if (!currentPassword) {
        setErrorMsg('Ingresa tu contraseña actual para autorizar el cambio de contraseña');
        return;
      }
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001/api';
      const token = localStorage.getItem('nexus-token') || localStorage.getItem('nexus_auth_token') || '';

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar el perfil');
      }

      setSuccessMsg('✅ ¡Perfil actualizado correctamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (onUpdateProfile && data.user) {
        onUpdateProfile(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'var(--surface-card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--line-200, #dde2e4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* CABECERA */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--line-200, #dde2e4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-bg, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--nexus-teal, #2A6F62)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                boxShadow: '0 2px 5px rgba(42, 111, 98, 0.3)'
              }}
            >
              {userInitials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="user-profile-title"
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--ink-900, #1e293b)'
                  }}
                >
                  {user.name}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isOwner ? 'rgba(42, 111, 98, 0.15)' : 'rgba(15, 52, 70, 0.12)',
                    color: isOwner ? '#2A6F62' : '#0F3446'
                  }}
                >
                  {isOwner ? '👑 Super Admin / Lead' : '👤 Colaborador'}
                </span>
              </div>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '13px',
                  color: 'var(--ink-500, #64748b)'
                }}
              >
                {user.email} · ID: {user.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: 'var(--ink-500, #64748b)',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px'
            }}
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line-200, #dde2e4)',
            padding: '0 24px',
            background: 'var(--surface-card, #ffffff)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'roles' ? '2px solid var(--nexus-teal, #2A6F62)' : '2px solid transparent',
              color: activeTab === 'roles' ? 'var(--nexus-teal, #2A6F62)' : 'var(--ink-500, #64748b)',
              fontWeight: activeTab === 'roles' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📋 Mis Roles y Permisos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'edit' ? '2px solid var(--nexus-teal, #2A6F62)' : '2px solid transparent',
              color: activeTab === 'edit' ? 'var(--nexus-teal, #2A6F62)' : 'var(--ink-500, #64748b)',
              fontWeight: activeTab === 'edit' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ⚙️ Ajustar Datos & Contraseña
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#15803d',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {successMsg}
            </div>
          )}

          {/* TAB 1: MIS ROLES Y PERMISOS */}
          {activeTab === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tarjeta de Rol Global */}
              <div
                style={{
                  border: '1px solid var(--line-200, #dde2e4)',
                  borderRadius: '10px',
                  padding: '16px',
                  background: 'var(--surface-bg, #f8fafc)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-500)', fontWeight: 600 }}>
                      Rol en la Plataforma
                    </span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '16px', color: 'var(--ink-900)' }}>
                      {isOwner ? '👑 Super Administrador / Líder de TI' : '👤 Miembro Colaborador'}
                    </h3>
                  </div>
                  <span
                    style={{
                      background: isOwner ? 'rgba(42, 111, 98, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                      color: isOwner ? '#2A6F62' : '#475569',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    Nivel: {user.role || 'admin'}
                  </span>
                </div>

                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.5 }}>
                  {isOwner ? (
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>Acceso completo a todos los proyectos del portafolio.</li>
                      <li>Creación, importación masiva y eliminación de proyectos.</li>
                      <li>Gestión de credenciales de usuario y directorio del equipo.</li>
                      <li>Aprobación de extensiones de fechas y auditoría de cambios.</li>
                    </ul>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>Acceso a proyectos donde colaboras o tienes tareas asignadas.</li>
                      <li>Registro de avance en tareas y bitácoras de trabajo.</li>
                      <li>Visualización de calendario y cronograma general.</li>
                    </ul>
                  )}
                </div>
              </div>

              {/* Información de Directorio */}
              {directoryEntry && (
                <div
                  style={{
                    border: '1px solid var(--line-200, #dde2e4)',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'var(--surface-card, #ffffff)'
                  }}
                >
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-500)', fontWeight: 600 }}>
                    Registro en Directorio de Equipo
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--ink-500)', display: 'block' }}>Organización / Área</span>
                      <strong style={{ fontSize: '14px', color: 'var(--ink-900)' }}>{directoryEntry.organization || 'Equipo Central'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--ink-500)', display: 'block' }}>Función</span>
                      <strong style={{ fontSize: '14px', color: 'var(--ink-900)', textTransform: 'capitalize' }}>
                        {directoryEntry.role === 'admin' ? 'Administrador' : directoryEntry.role || 'Colaborador'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Roles en Proyectos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    Participación en Proyectos ({participatingProjects.length})
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                    Roles asignados por proyecto
                  </span>
                </div>

                <div
                  style={{
                    border: '1px solid var(--line-200, #dde2e4)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-bg, #f8fafc)', borderBottom: '1px solid var(--line-200, #dde2e4)' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-600)' }}>Proyecto</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-600)' }}>Tu Rol</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-600)', textAlign: 'right' }}>Tareas Asignadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participatingProjects.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--line-100, #f1f5f9)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--nexus-teal, #2A6F62)', marginRight: '6px' }}>
                              [{p.code}]
                            </span>
                            <span style={{ color: 'var(--ink-900)' }}>{p.name}</span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: p.role.includes('Líder') ? 'rgba(42, 111, 98, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                                color: p.role.includes('Líder') ? '#2A6F62' : '#475569'
                              }}
                            >
                              {p.role}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-700)' }}>
                            {p.taskCount > 0 ? `${p.taskCount} tareas` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AJUSTAR DATOS & CONTRASEÑA */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line-200, #dde2e4)',
                    background: 'var(--surface-bg, #ffffff)',
                    color: 'var(--ink-900)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line-200, #dde2e4)',
                    background: 'var(--surface-bg, #ffffff)',
                    color: 'var(--ink-900)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line-200, #dde2e4)'
                }}
              >
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--ink-900)' }}>
                  Cambiar Contraseña (Opcional)
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--ink-500)' }}>
                  Deja estos campos en blanco si solo deseas actualizar tu nombre o correo.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-700)', marginBottom: '4px' }}>
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      style={{
                        width: '100%',
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line-200, #dde2e4)',
                        background: 'var(--surface-bg, #ffffff)',
                        color: 'var(--ink-900)',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-700)', marginBottom: '4px' }}>
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line-200, #dde2e4)',
                          background: 'var(--surface-bg, #ffffff)',
                          color: 'var(--ink-900)',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-700)', marginBottom: '4px' }}>
                        Confirmar nueva contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--line-200, #dde2e4)',
                          background: 'var(--surface-bg, #ffffff)',
                          color: 'var(--ink-900)',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="ui-btn ui-btn--secondary"
                  style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ui-btn ui-btn--primary"
                  style={{ height: '38px', padding: '0 18px', fontSize: '13px' }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
