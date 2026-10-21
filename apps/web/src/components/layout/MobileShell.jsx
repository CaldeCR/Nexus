import React, { useState } from 'react';
import { NavIcons } from './NavIcons';

export function MobileShell({
  view,
  onNavigate,
  space,
  onSpaceChange,
  projects,
  selectedProjectId,
  onSelectProject,
  totalStaleCount = 0,
  onOpenDailyCheckin,
  darkMode,
  onToggleTheme,
  user,
  onLogout,
  onFabClick,
  onCreatePersonalProject,
  children
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const viewTitles = {
    home: 'Inicio',
    portfolio: 'Mis proyectos',
    tasks: 'Mis tareas',
    agenda: 'Agenda',
    kanban: 'Tablero',
    timeline: 'Cronograma',
    directory: 'Directorio'
  };

  const currentTitle = viewTitles[view] || 'Nexus';

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JC';

  const navItems = [
    { key: 'home', label: 'Inicio', icon: <NavIcons.Home size={20} /> },
    { key: 'portfolio', label: 'Mis Proyectos', count: projects?.length, icon: <NavIcons.Folder size={20} /> },
    { key: 'tasks', label: 'Tareas', icon: <NavIcons.SquareCheck size={20} /> },
    { key: 'agenda', label: 'Agenda', icon: <NavIcons.Calendar size={20} /> },
    { key: 'kanban', label: 'Tablero', icon: <NavIcons.Columns3 size={20} /> },
    { key: 'timeline', label: 'Cronograma', icon: <NavIcons.ChartGantt size={20} /> },
    { key: 'directory', label: 'Directorio', icon: <NavIcons.Users size={20} /> },
  ];

  return (
    <div className="mobile-shell-wrapper">
      {/* 1. BARRA SUPERIOR MÓVIL (56px) */}
      <header className="mobile-topbar" aria-label="Cabecera móvil">
        <div className="mobile-topbar-left">
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <NavIcons.Menu size={22} />
          </button>
          <img
            src="/logobase01.png"
            alt="Nexus"
            style={{ width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => onNavigate('home')}
            title="Ir a Inicio"
          />
          <h1 className="mobile-title">{currentTitle}</h1>
        </div>

        <div className="mobile-topbar-right">
          {/* DAILY CHECK-IN BUTTON */}
          <button
            type="button"
            className={`top-daily-checkin-btn ${totalStaleCount > 0 ? 'has-pending' : 'is-clean'}`}
            onClick={onOpenDailyCheckin}
            title={`Daily Check-in (${totalStaleCount} pendientes)`}
            aria-label="Daily Check-in"
            style={{ width: '32px', height: '32px' }}
          >
            <NavIcons.DailyCheck size={16} />
            {totalStaleCount > 0 && (
              <span className="top-daily-checkin-badge danger" style={{ minWidth: '15px', height: '15px', fontSize: '0.6rem' }}>
                {totalStaleCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="rail-avatar-btn"
            style={{ width: '32px', height: '32px', fontSize: '11px' }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Ver perfil y menú"
          >
            {userInitials}
          </button>
        </div>
      </header>

      {/* 2. DRAWER MÓVIL (Muestra las opciones del panel principal: Mis Proyectos, Tareas, etc.) */}
      {drawerOpen && (
        <>
          <div
            className="panel-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menú principal">
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logobase01.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 'var(--text-base)', lineHeight: 1.2, color: '#FFFFFF' }}>Nexus</strong>
                  <span style={{ fontSize: 'var(--text-xs)', color: '#A8C3CF' }}>Track your goals</span>
                </div>
              </div>
              <button
                type="button"
                className="side-panel-close-btn"
                onClick={() => setDrawerOpen(false)}
                style={{ color: '#ffffff' }}
                aria-label="Cerrar menú"
              >
                <NavIcons.Close size={20} />
              </button>
            </div>

            {/* OPCIONES DE NAVEGACIÓN */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }} aria-label="Navegación móvil">
              {navItems.map((item) => {
                const isActive = view === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`mobile-drawer-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setDrawerOpen(false);
                      onNavigate(item.key);
                    }}
                  >
                    <span className="mobile-drawer-nav-icon">{item.icon}</span>
                    <span className="mobile-drawer-nav-label">{item.label}</span>
                    {item.count !== undefined && item.count !== null && item.count > 0 && (
                      <span className="mobile-drawer-nav-badge">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mobile-drawer-footer">
              <button
                type="button"
                className="mobile-drawer-footer-btn"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenDailyCheckin();
                }}
              >
                <NavIcons.DailyCheck size={18} />
                <span>Daily Check-in ({totalStaleCount > 0 ? `${totalStaleCount} pendientes` : 'Al día'})</span>
              </button>

              <button
                type="button"
                className="mobile-drawer-footer-btn"
                onClick={() => {
                  onToggleTheme();
                }}
              >
                {darkMode ? <NavIcons.Sun size={18} /> : <NavIcons.Moon size={18} />}
                <span>Tema: Modo {darkMode ? 'Claro' : 'Oscuro'}</span>
              </button>

              <button
                type="button"
                className="mobile-drawer-footer-btn"
                style={{ color: 'var(--danger-600)' }}
                onClick={() => {
                  setDrawerOpen(false);
                  onLogout();
                }}
              >
                <NavIcons.LogOut size={18} />
                <span>Cerrar sesión ({user?.name || 'Usuario'})</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="app-content">
        {children}
      </main>

      {/* 4. BOTÓN FLOTANTE FAB (56x56) */}
      <button
        type="button"
        className="mobile-fab"
        onClick={onFabClick}
        aria-label="Acción principal: crear elemento"
        title="Crear"
      >
        <NavIcons.Plus size={26} />
      </button>

      {/* 5. BARRA INFERIOR DE PESTAÑAS (68px) */}
      <nav className="mobile-tabbar" aria-label="Navegación inferior móvil">
        <button
          type="button"
          className={`mobile-tab-item ${view === 'portfolio' ? 'is-active' : ''}`}
          onClick={() => onNavigate('portfolio')}
          aria-current={view === 'portfolio' ? 'page' : undefined}
        >
          <NavIcons.Folder size={20} />
          <span>Proyectos</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-item ${view === 'tasks' ? 'is-active' : ''}`}
          onClick={() => onNavigate('tasks')}
          aria-current={view === 'tasks' ? 'page' : undefined}
        >
          <NavIcons.SquareCheck size={20} />
          <span>Tareas</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-item ${view === 'kanban' ? 'is-active' : ''}`}
          onClick={() => onNavigate('kanban')}
          aria-current={view === 'kanban' ? 'page' : undefined}
        >
          <NavIcons.Columns3 size={20} />
          <span>Tablero</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-item ${view === 'timeline' ? 'is-active' : ''}`}
          onClick={() => onNavigate('timeline')}
          aria-current={view === 'timeline' ? 'page' : undefined}
        >
          <NavIcons.ChartGantt size={20} />
          <span>Cronograma</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-item ${view === 'agenda' ? 'is-active' : ''}`}
          onClick={() => onNavigate('agenda')}
          aria-current={view === 'agenda' ? 'page' : undefined}
        >
          <NavIcons.Calendar size={20} />
          <span>Agenda</span>
        </button>
      </nav>
    </div>
  );
}
