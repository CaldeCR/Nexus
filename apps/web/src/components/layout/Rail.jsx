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
  onLogout
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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
          className={`rail-bottom-item ${railExpanded ? 'is-expanded-btn' : ''} ${totalStaleCount > 0 ? 'has-pending' : 'is-clean'}`}
          onClick={onOpenDailyCheckin}
          title={
            totalStaleCount > 0
              ? `Daily Check-in: ${totalStaleCount} ${totalStaleCount === 1 ? 'tarea requiere' : 'tareas requieren'} atención hoy`
              : 'Daily Check-in: Todas las tareas al día'
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
        <div style={{ position: 'relative', width: railExpanded ? '100%' : 'auto' }}>
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
                position: 'absolute',
                bottom: 0,
                left: railExpanded ? '100%' : '52px',
                marginLeft: railExpanded ? '8px' : 0,
                width: '210px',
                background: 'var(--surface-card)',
                border: '1px solid var(--line-200)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-floating)',
                padding: '8px',
                zIndex: 100,
                color: 'var(--ink-900)'
              }}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--line-100)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--ink-900)' }}>
                  {user?.name || 'Jorge Calderón'}
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                  {user?.email || 'jorge@empresa.com'}
                </span>
              </div>

              <div style={{ padding: '4px 0' }}>
                <button
                  type="button"
                  className="mobile-drawer-footer-btn"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onToggleTheme();
                  }}
                  style={{ fontSize: 'var(--text-xs)', padding: '6px 8px' }}
                >
                  {darkMode ? <NavIcons.Sun size={14} /> : <NavIcons.Moon size={14} />}
                  <span>Modo {darkMode ? 'Claro' : 'Oscuro'}</span>
                </button>

                <button
                  type="button"
                  className="mobile-drawer-footer-btn"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLogout();
                  }}
                  style={{ fontSize: 'var(--text-xs)', padding: '6px 8px', color: 'var(--danger-600)' }}
                >
                  <NavIcons.LogOut size={14} />
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
