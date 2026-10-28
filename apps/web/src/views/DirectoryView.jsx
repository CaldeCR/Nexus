import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

export function DirectoryView({
  teamDirectory = [],
  workItems = [],
  isAdmin = false,
  onOpenNewDirectoryMember,
  onEditDirectoryMember,
  onDeleteDirectoryMember,
  onGenerateAccount,
  onResetPassword,
  onRevokeAccess
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'has_account' | 'collaborator' | 'vendor' | 'admin'
  const [searchTerm, setSearchTerm] = useState('');
  const [menuMemberId, setMenuMemberId] = useState(null);

  // Close actions menu on outside click
  React.useEffect(() => {
    const handleOutside = () => setMenuMemberId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const rolesMeta = {
    admin: { label: 'Administrador', dot: '#0F3446', tone: '#0F3446' },
    collaborator: { label: 'Colaborador', dot: '#2A6F62', tone: '#2A6F62' },
    vendor: { label: 'Proveedor', dot: '#7A5C3E', tone: '#7A5C3E' }
  };

  const tones = ['#2A6F62', '#0F3446', '#4A6B7A', '#7A5C3E', '#5C6670'];
  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(/[\s-]+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };

  // Count open tasks per person
  const openTasksCount = useMemo(() => {
    const counts = {};
    workItems.forEach((t) => {
      if (t.status !== 'done') {
        const assignees = Array.isArray(t.assignees) && t.assignees.length > 0
          ? t.assignees
          : (t.assignee ? [t.assignee] : []);
        assignees.forEach((a) => {
          counts[a] = (counts[a] || 0) + 1;
        });
      }
    });
    return counts;
  }, [workItems]);

  // Tab stats
  const countsByTab = useMemo(() => {
    const stats = {
      all: teamDirectory.length,
      has_account: teamDirectory.filter((m) => Boolean(m.hasUserAccount)).length,
      reference: teamDirectory.filter((m) => !m.hasUserAccount).length,
      collaborator: teamDirectory.filter((m) => (m.role || 'collaborator') === 'collaborator').length,
      vendor: teamDirectory.filter((m) => m.role === 'vendor').length,
      admin: teamDirectory.filter((m) => m.role === 'admin' || m.userRole === 'admin').length
    };
    return stats;
  }, [teamDirectory]);

  // Filter directory members
  const filteredMembers = useMemo(() => {
    return teamDirectory.filter((m) => {
      if (activeTab === 'has_account') {
        if (!m.hasUserAccount) return false;
      } else if (activeTab === 'reference') {
        if (m.hasUserAccount) return false;
      } else if (activeTab === 'admin') {
        if (m.role !== 'admin' && m.userRole !== 'admin') return false;
      } else if (activeTab !== 'all') {
        const role = m.role || 'collaborator';
        if (role !== activeTab) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(term);
        const matchEmail = (m.email || '').toLowerCase().includes(term);
        const matchOrg = (m.organization || '').toLowerCase().includes(term);
        if (!matchName && !matchEmail && !matchOrg) return false;
      }
      return true;
    });
  }, [teamDirectory, activeTab, searchTerm]);

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px)                                                    */
  /* ========================================================================= */
  if (isMobile) {
    return (
      <div style={{ flex: 1, padding: '12px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
        {/* Selector de Tabs */}
        <div style={{ display: 'flex', background: '#EDF0F0', borderRadius: '8px', padding: '3px', marginBottom: '6px', overflowX: 'auto', gap: '2px' }}>
          {[
            { id: 'all', label: `Todos (${countsByTab.all})` },
            { id: 'has_account', label: `Con Acceso (${countsByTab.has_account})` },
            { id: 'reference', label: `Solo Ref. (${countsByTab.reference})` },
            { id: 'collaborator', label: `Colab. (${countsByTab.collaborator})` },
            { id: 'vendor', label: `Prov. (${countsByTab.vendor})` }
          ].map((t) => {
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 'none',
                  padding: '0 10px',
                  height: '34px',
                  border: 0,
                  borderRadius: '6px',
                  font: 'inherit',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: on ? '#FFFFFF' : 'transparent',
                  color: on ? '#1D2A33' : '#5F6B76',
                  boxShadow: on ? '0 1px 2px rgba(15,52,70,0.15)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Lista de Tarjetas */}
        {filteredMembers.map((p, idx) => {
          const role = p.role || 'collaborator';
          const meta = rolesMeta[role] || rolesMeta.collaborator;
          const taskCount = openTasksCount[p.name] || 0;
          const hasAccount = Boolean(p.hasUserAccount);
          const userRoleLabel = p.userRole === 'admin' ? 'Admin' : 'Colaborador';

          return (
            <div
              key={p.id || p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#FFFFFF',
                border: '1px solid #DDE2E4',
                borderRadius: '8px',
                padding: '10px 8px 10px 12px',
                position: 'relative'
              }}
            >
              <span
                style={{
                  width: '40px',
                  height: '40px',
                  flex: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: tones[idx % tones.length]
                }}
              >
                {getInitials(p.name)}
              </span>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#1D2A33' }}>{p.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.dot }} />
                  {meta.label} {p.organization ? `· ${p.organization}` : ''}
                </span>
                <span style={{ fontSize: '12px', color: '#5F6B76' }}>
                  {taskCount ? `${taskCount} tareas` : 'Sin tareas'} ·{' '}
                  {hasAccount ? (
                    <span style={{ color: p.userRole === 'admin' ? '#0F3446' : '#2A6F62', fontWeight: 600 }}>
                      🔑 {userRoleLabel}
                    </span>
                  ) : (
                    <span style={{ color: '#5F6B76' }}>👤 Solo Referencia</span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuMemberId(menuMemberId === (p.id || p.name) ? null : (p.id || p.name));
                }}
                aria-label={`Acciones para ${p.name}`}
                style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #DDE2E4',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#5F6B76',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {menuMemberId === (p.id || p.name) && (
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '52px',
                    background: '#FFFFFF',
                    border: '1px solid #DDE2E4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(15, 52, 70, 0.15)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '180px',
                    zIndex: 20
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAdmin && (
                    <>
                      {!hasAccount ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuMemberId(null);
                            onGenerateAccount?.(p);
                          }}
                          style={{
                            border: 0,
                            background: 'transparent',
                            padding: '8px 10px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#2A6F62',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🔑</span>
                          <span>Generar credenciales</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuMemberId(null);
                              onResetPassword?.(p);
                            }}
                            style={{
                              border: 0,
                              background: 'transparent',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#0F3446',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🔄</span>
                            <span>Restablecer clave</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuMemberId(null);
                              onRevokeAccess?.(p);
                            }}
                            style={{
                              border: 0,
                              background: 'transparent',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              color: '#B91C1C',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🚫</span>
                            <span>Revocar acceso</span>
                          </button>
                        </>
                      )}
                      <div style={{ height: '1px', background: '#EDEFF0', margin: '4px 0' }} />
                    </>
                  )}
                  {onEditDirectoryMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuMemberId(null);
                        onEditDirectoryMember(p);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#1D2A33',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Editar persona
                    </button>
                  )}
                  {onDeleteDirectoryMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuMemberId(null);
                        onDeleteDirectoryMember(p);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#9B3B32',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET (§7.6)                                          */
  /* ========================================================================= */
  return (
    <div style={{ flex: 1, minWidth: 0, padding: bp === 'tablet' ? '24px 28px' : '32px 40px 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyBetween: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#1D2A33' }}>Directorio</h1>
          <span style={{ fontSize: '14px', color: '#5F6B76' }}>Personas y proveedores reutilizables en todos tus proyectos</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Buscador */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '6px', padding: '0 12px', height: '40px', width: '260px', boxSizing: 'border-box', color: '#5F6B76' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Buscar persona u organización</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar persona u organización"
              style={{ border: 0, outline: 'none', background: 'transparent', font: 'inherit', color: '#1D2A33', flex: 1, minWidth: 0 }}
            />
          </label>

          <button
            type="button"
            onClick={onOpenNewDirectoryMember}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '40px',
              padding: '0 16px',
              border: 0,
              borderRadius: '6px',
              background: '#2A6F62',
              color: '#FFFFFF',
              font: 'inherit',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar persona
          </button>
        </div>
      </div>

      {/* Toolbar con Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div role="tablist" aria-label="Tipo" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #DDE2E4', flex: 1, overflowX: 'auto' }}>
          {[
            { id: 'all', label: `Todos (${countsByTab.all})` },
            { id: 'has_account', label: `Con Acceso (${countsByTab.has_account})` },
            { id: 'reference', label: `Solo Referencia (${countsByTab.reference})` },
            { id: 'collaborator', label: `Colaboradores (${countsByTab.collaborator})` },
            { id: 'vendor', label: `Proveedores (${countsByTab.vendor})` },
            { id: 'admin', label: `Administradores (${countsByTab.admin})` }
          ].map((t) => {
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveTab(t.id)}
                style={{
                  height: '42px',
                  padding: '0 2px',
                  marginBottom: '-1px',
                  border: 0,
                  borderBottom: on ? '2px solid #2A6F62' : '2px solid transparent',
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: '13px',
                  fontWeight: on ? 600 : 500,
                  color: on ? '#1D2A33' : '#5F6B76',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '13px', color: '#5F6B76' }}>
          {filteredMembers.length} personas en el directorio
        </span>
      </div>

      {/* Tabla del Directorio */}
      <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F6F7F7', borderBottom: '1px solid #DDE2E4', color: '#5F6B76', fontSize: '12px' }}>
              <th style={{ padding: '12px 20px', fontWeight: 500 }}>Persona</th>
              <th style={{ padding: '12px 14px', fontWeight: 500 }}>Organización / Área</th>
              <th style={{ padding: '12px 14px', fontWeight: 500 }}>Rol</th>
              <th style={{ padding: '12px 14px', fontWeight: 500 }}>Tareas abiertas</th>
              <th style={{ padding: '12px 14px', fontWeight: 500 }}>Acceso al Sistema</th>
              <th style={{ padding: '12px 20px', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m, idx) => {
              const role = m.role || 'collaborator';
              const meta = rolesMeta[role] || rolesMeta.collaborator;
              const taskCount = openTasksCount[m.name] || 0;
              const hasAccount = Boolean(m.hasUserAccount);
              const userRoleLabel = m.userRole === 'admin' ? 'Administrador' : 'Colaborador';

              return (
                <tr key={m.id || m.name} style={{ borderBottom: '1px solid #EDEFF0' }}>
                  {/* Persona */}
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          background: tones[idx % tones.length]
                        }}
                      >
                        {getInitials(m.name)}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '13px', color: '#1D2A33' }}>{m.name}</strong>
                        {m.email && <span style={{ fontSize: '12px', color: '#5F6B76' }}>{m.email}</span>}
                      </div>
                    </div>
                  </td>

                  {/* Organización */}
                  <td style={{ padding: '12px 14px', color: '#5F6B76' }}>
                    {m.organization || 'Nexus Team'}
                  </td>

                  {/* Rol */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1D2A33' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.dot }} />
                      {meta.label}
                    </span>
                  </td>

                  {/* Tareas */}
                  <td style={{ padding: '12px 14px', color: taskCount ? '#1D2A33' : '#5F6B76' }}>
                    {taskCount ? `${taskCount} tareas` : '—'}
                  </td>

                  {/* Acceso */}
                  <td style={{ padding: '12px 14px' }}>
                    {hasAccount ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: m.userRole === 'admin' ? 'rgba(15, 52, 70, 0.10)' : 'rgba(42, 111, 98, 0.12)',
                          color: m.userRole === 'admin' ? '#0F3446' : '#2A6F62',
                          border: m.userRole === 'admin' ? '1px solid rgba(15, 52, 70, 0.25)' : '1px solid rgba(42, 111, 98, 0.25)'
                        }}
                        title={`Cuenta de acceso activa. Rol en sistema: ${userRoleLabel}`}
                      >
                        <span style={{ fontSize: '11px' }}>🔑</span>
                        <span>{userRoleLabel}</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: '#F1F4F4',
                          color: '#5F6B76',
                          border: '1px solid #DDE2E4'
                        }}
                        title="Integrante registrado como referencia para tareas y proyectos (sin acceso al sistema)"
                      >
                        <span>👤</span>
                        <span>Solo Referencia</span>
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '12px 20px', textAlign: 'right', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {isAdmin && !hasAccount && (
                        <button
                          type="button"
                          onClick={() => onGenerateAccount?.(m)}
                          title="Generar credenciales de usuario para este integrante"
                          style={{
                            height: '30px',
                            padding: '0 10px',
                            border: '1px solid #2A6F62',
                            borderRadius: '6px',
                            background: 'rgba(42, 111, 98, 0.08)',
                            color: '#2A6F62',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🔑</span>
                          <span>Generar acceso</span>
                        </button>
                      )}

                      {isAdmin && hasAccount && (
                        <button
                          type="button"
                          onClick={() => onResetPassword?.(m)}
                          title="Restablecer manualmente la contraseña de este usuario"
                          style={{
                            height: '30px',
                            padding: '0 10px',
                            border: '1px solid #DDE2E4',
                            borderRadius: '6px',
                            background: '#FFFFFF',
                            color: '#0F3446',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🔄</span>
                          <span>Cambiar clave</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuMemberId(menuMemberId === (m.id || m.name) ? null : (m.id || m.name));
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid #DDE2E4',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#5F6B76',
                          cursor: 'pointer'
                        }}
                        title="Más opciones"
                      >
                        ⋯
                      </button>
                    </div>

                    {menuMemberId === (m.id || m.name) && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '20px',
                          top: '44px',
                          background: '#FFFFFF',
                          border: '1px solid #DDE2E4',
                          borderRadius: '8px',
                          boxShadow: '0 4px 16px rgba(15, 52, 70, 0.15)',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '180px',
                          zIndex: 20
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAdmin && (
                          <>
                            {!hasAccount ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuMemberId(null);
                                  onGenerateAccount?.(m);
                                }}
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  padding: '8px 10px',
                                  textAlign: 'left',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#2A6F62',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>🔑</span>
                                <span>Generar credenciales</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuMemberId(null);
                                    onResetPassword?.(m);
                                  }}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#0F3446',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>🔄</span>
                                  <span>Restablecer clave</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuMemberId(null);
                                    onRevokeAccess?.(m);
                                  }}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    color: '#B91C1C',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>🚫</span>
                                  <span>Revocar acceso</span>
                                </button>
                              </>
                            )}
                            <div style={{ height: '1px', background: '#EDEFF0', margin: '4px 0' }} />
                          </>
                        )}
                        {onEditDirectoryMember && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuMemberId(null);
                              onEditDirectoryMember(m);
                            }}
                            style={{
                              border: 0,
                              background: 'transparent',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              color: '#1D2A33',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                          >
                            Editar persona
                          </button>
                        )}
                        {onDeleteDirectoryMember && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuMemberId(null);
                              onDeleteDirectoryMember(m);
                            }}
                            style={{
                              border: 0,
                              background: 'transparent',
                              padding: '8px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              color: '#9B3B32',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                          >
                            Eliminar del directorio
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
