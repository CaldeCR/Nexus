import React, { useState } from 'react';
import { NavIcons } from './NavIcons';

export function Rail({
  activeView,
  onNavigate,
  onSelectPortfolio,
  railExpanded = false,
  onToggleRail,
  projectsCount = 0,
  totalStaleCount = 0,
  onOpenDailyCheckin,
  darkMode,
  onToggleTheme,
  user,
  onLogout,
  onOpenProfileModal,
  onOpenCategoryManager
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const userBtnRef = React.useRef(null);
  const [menuCoords, setMenuCoords] = useState({ left: 72, bottom: 16 });

  // Recalcular posición fixed del menú para escapar el overflow de la barra lateral
  React.useEffect(() => {
    if (accountMenuOpen && userBtnRef.current) {
      const rect = userBtnRef.current.getBoundingClientRect();
      setMenuCoords({
        left: rect.right + 12,
        bottom: Math.max(16, window.innerHeight - rect.bottom)
      });
    }
  }, [accountMenuOpen, railExpanded]);

  // Cerrar al hacer clic fuera del menú
  React.useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (userBtnRef.current && !userBtnRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [accountMenuOpen]);

  const navItems = [
    { key: 'home', label: 'Inicio', icon: <NavIcons.Home size={20} /> },
    { key: 'portfolio', label: 'Mis Proyectos', count: projectsCount, icon: <NavIcons.Folder size={20} /> },
    { key: 'tasks', label: 'Tareas', icon: <NavIcons.SquareCheck size={20} /> },
    { key: 'agenda', label: 'Agenda', icon: <NavIcons.Calendar size={20} /> },
    { key: 'kanban', label: 'Tablero', icon: <NavIcons.Columns3 size={20} /> },
    { key: 'timeline', label: 'Cronograma', icon: <NavIcons.ChartGantt size={20} /> },
    { key: 'directory', label: 'Directorio', icon: <NavIcons.Users size={20} /> },
  ];

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JC';

  const handleItemClick = (key) => {
    if (key === 'portfolio') {
      if (onSelectPortfolio) {
        onSelectPortfolio();
      } else {
        onNavigate('portfolio');
      }
    } else {
      onNavigate(key);
    }
  };

  return (
    <aside
      className={`rail ${railExpanded ? 'is-expanded' : ''}`}
      aria-label="Navegación principal"
    >
      {/* 1. CABECERA CON LOGO Y BOTÓN HAMBURGUESA ☰ */}
      {railExpanded ? (
        <div className="rail-expanded-top">
          <div className="rail-brand-group">
            <a
              href="#home"
              className="rail-logo-link-inline"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
              title="Nexus — Inicio / Centro de Mando"
            >
              <img src="/logobase01.png" alt="Nexus Logo" className="rail-logo-img" />
            </a>
            <div className="rail-brand-text">
              <strong className="rail-brand-title">Nexus</strong>
              <span className="rail-brand-subtitle">Track your goals</span>
            </div>
          </div>
          <button
            type="button"
            className="rail-toggle-btn is-active"
            onClick={onToggleRail}
            aria-expanded={railExpanded}
            title="Contraer menú"
            aria-label="Contraer menú"
          >
            <NavIcons.Menu size={20} />
          </button>
        </div>
      ) : (
        <div className="rail-collapsed-top">
          <a
            href="#home"
            className="rail-logo-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            title="Nexus — Inicio / Centro de Mando"
          >
            <img src="/logobase01.png" alt="Nexus Logo" className="rail-logo-img" />
          </a>

          {/* BOTÓN ☰ (Muestra todas las opciones del panel izquierdo) */}
          <button
            type="button"
            className="rail-toggle-btn"
            onClick={onToggleRail}
            aria-expanded={railExpanded}
            title="Expandir menú (Mis Proyectos, Tareas, Agenda...)"
            aria-label="Expandir menú de navegación"
          >
            <NavIcons.Menu size={20} />
          </button>
        </div>
      )}

      {/* 2. DIVISOR */}
      <div className="rail-divider" />

      {/* 3. SECCIONES DE NAVEGACIÓN (Mis Proyectos, Tareas, Agenda, Tablero, Cronograma, Directorio) */}
      <nav className="rail-nav" aria-label="Navegación">
        {navItems.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`rail-item ${isActive ? 'is-active' : ''}`}
              onClick={() => handleItemClick(item.key)}
              title={railExpanded ? undefined : item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="rail-item-icon">{item.icon}</span>
              {railExpanded && (
                <>
                  <span className="rail-item-label">{item.label}</span>
                  {item.count !== undefined && item.count !== null && item.count > 0 && (
                    <span className="rail-item-badge">{item.count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. ESPACIADOR */}
      <div className="rail-spacer" />

      {/* 5. ACCIONES INFERIORES */}
      <div className="rail-bottom">
        {/* BOTÓN DAILY CHECK-IN */}
        <button
          type="button"
          className={`rail-bottom-item ${railExpanded ? 'is-expanded-btn' : ''} ${totalStaleCount > 0 ? 'has-pending' : 'is-clean'} ${activeView === 'daily-check' ? 'is-active' : ''}`}
          onClick={() => onNavigate('daily-check')}
          title={
            totalStaleCount > 0
              ? `Daily Check-in: ${totalStaleCount} ${totalStaleCount === 1 ? 'tarea requiere' : 'tareas requieren'} atención hoy`
              : 'Daily Check-in: Bitácora y seguimiento continuo'
          }
          aria-label="Daily Check-in"
        >
          <span className="rail-item-icon">
            <NavIcons.DailyCheck size={18} />
          </span>
          {railExpanded ? (
            <>
              <span className="rail-item-label">Daily Check-in</span>
              {totalStaleCount > 0 ? (
                <span className="top-daily-checkin-badge danger" style={{ position: 'static' }}>{totalStaleCount}</span>
              ) : (
                <span className="top-daily-checkin-badge success" style={{ position: 'static' }}>✓</span>
              )}
            </>
          ) : (
            totalStaleCount > 0 ? (
              <span className="top-daily-checkin-badge danger">{totalStaleCount}</span>
            ) : (
              <span className="top-daily-checkin-badge success">✓</span>
            )
          )}
        </button>

        {/* CAMBIO DE TEMA */}
        <button
          type="button"
          className={`rail-bottom-item ${railExpanded ? 'is-expanded-btn' : ''}`}
          onClick={onToggleTheme}
          title={darkMode ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          aria-label="Alternar tema claro y oscuro"
        >
          <span className="rail-item-icon">
            {darkMode ? <NavIcons.Sun size={18} /> : <NavIcons.Moon size={18} />}
          </span>
          {railExpanded && (
            <span className="rail-item-label">
              {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          )}
        </button>

        {/* AYUDA */}
        <button
          type="button"
          className={`rail-bottom-item ${railExpanded ? 'is-expanded-btn' : ''}`}
          onClick={() => alert('Nexus TI — Sistema de Gestión y Seguimiento de Metas.\nPara soporte o dudas contacta a soporte@nexus.local')}
          title="Ayuda y documentación"
          aria-label="Ayuda"
        >
          <span className="rail-item-icon">
            <NavIcons.CircleHelp size={18} />
          </span>
          {railExpanded && <span className="rail-item-label">Ayuda</span>}
        </button>

        {/* AVATAR DE USUARIO CON MENÚ */}
        <div ref={userBtnRef} style={{ position: 'relative', width: railExpanded ? '100%' : 'auto' }}>
          <button
            type="button"
            className={railExpanded ? 'rail-user-card-btn' : 'rail-avatar-btn'}
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            title={`Cuenta: ${user?.name || 'Usuario'} (${user?.role || 'Admin'})`}
            aria-label="Menú de cuenta"
            aria-expanded={accountMenuOpen}
          >
            <div className="rail-avatar-circle">{userInitials}</div>
            {railExpanded && (
              <div className="rail-user-info">
                <span className="rail-user-name">{user?.name || 'Jorge Calderón'}</span>
                <span className="rail-user-role">{user?.role || 'Líder de TI / PM'}</span>
              </div>
            )}
          </button>

          {accountMenuOpen && (
            <div
              style={{
                position: 'fixed',
                bottom: `${menuCoords.bottom}px`,
                left: `${menuCoords.left}px`,
                width: '230px',
                background: 'var(--surface-card, #ffffff)',
                border: '1px solid var(--line-200, #dde2e4)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
                padding: '10px',
                zIndex: 99999,
                color: 'var(--ink-900)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line-100)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--ink-900)' }}>
                  {user?.name || 'Usuario'}
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                  {user?.email || 'usuario@nexus.local'}
                </span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: 'var(--nexus-teal, #2A6F62)', background: 'rgba(42, 111, 98, 0.12)', padding: '2px 7px', borderRadius: '4px' }}>
                    {user?.role === 'owner' || user?.role === 'admin' ? '👑 Super Admin / Lead' : '👤 Colaborador'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '6px 0 2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button
                  type="button"
                  className="mobile-drawer-footer-btn"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    if (onOpenProfileModal) onOpenProfileModal();
                  }}
                  style={{ fontSize: 'var(--text-xs)', padding: '8px 10px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-900)', fontWeight: 600, background: 'var(--surface-hover, rgba(0,0,0,0.03))' }}
                  title="Ver roles asignados y editar datos"
                >
                  <NavIcons.Users size={15} />
                  <span>Mi Perfil y Roles</span>
                </button>

                {(user?.role === 'owner' || user?.role === 'admin') && onOpenCategoryManager && (
                  <button
                    type="button"
                    className="mobile-drawer-footer-btn"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenCategoryManager();
                    }}
                    style={{ fontSize: 'var(--text-xs)', padding: '8px 10px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 600, background: '#f0f9ff' }}
                    title="CMS de Catálogos y Tipologías de Proyecto"
                  >
                    <span>⚙️</span>
                    <span>CMS de Catálogos</span>
                  </button>
                )}

                <button
                  type="button"
                  className="mobile-drawer-footer-btn"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onToggleTheme();
                  }}
                  style={{ fontSize: 'var(--text-xs)', padding: '8px 10px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {darkMode ? <NavIcons.Sun size={15} /> : <NavIcons.Moon size={15} />}
                  <span>Modo {darkMode ? 'Claro' : 'Oscuro'}</span>
                </button>

                <button
                  type="button"
                  className="mobile-drawer-footer-btn"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLogout();
                  }}
                  style={{ fontSize: 'var(--text-xs)', padding: '8px 10px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-600)' }}
                >
                  <NavIcons.LogOut size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
