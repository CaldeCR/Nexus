import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Rail } from './Rail';
import { SidePanel } from './SidePanel';
import { MobileShell } from './MobileShell';

export function AppShell({
  view,
  onNavigate,
  space = 'all',
  onSpaceChange,
  projects = [],
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
  const bp = useBreakpoint(); // 'mobile' | 'tablet' | 'laptop' | 'desktop'
  const isTablet = bp === 'tablet';

  const [railExpanded, setRailExpanded] = usePersistentState('nexus-rail-expanded', false);
  const [projectsPanelOpen, setProjectsPanelOpen] = useState(false);

  // Atajo de teclado: '[' alterna el panel de proyectos (en Mis Proyectos) o expande el menú
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        if (view === 'portfolio') {
          setProjectsPanelOpen((prev) => !prev);
        } else {
          setRailExpanded((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, setRailExpanded]);

  // Manejo de clic en 'Mis Proyectos': navega y muestra/alterna el panel de proyectos
  const handleSelectPortfolio = () => {
    if (view === 'portfolio') {
      setProjectsPanelOpen((prev) => !prev);
    } else {
      onNavigate('portfolio');
      setProjectsPanelOpen(true);
    }
    if (railExpanded) {
      setRailExpanded(false);
    }
  };

  // Manejo de navegación a otras vistas: cierra el panel de proyectos
  const handleNavigateOther = (targetView) => {
    setProjectsPanelOpen(false);
    onNavigate(targetView);
  };

  // Si estamos en móvil (< 768px), delegar al Shell móvil completo
  if (bp === 'mobile') {
    return (
      <MobileShell
        view={view}
        onNavigate={onNavigate}
        space={space}
        onSpaceChange={onSpaceChange}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        totalStaleCount={totalStaleCount}
        onOpenDailyCheckin={onOpenDailyCheckin}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onFabClick={onFabClick}
        onCreatePersonalProject={onCreatePersonalProject}
      >
        {children}
      </MobileShell>
    );
  }

  return (
    <div className={`app-shell ${railExpanded ? 'is-rail-expanded' : ''}`}>
      {/* 1. RIEL GLOBAL (64px o 240px expandido) */}
      <Rail
        activeView={view}
        onNavigate={handleNavigateOther}
        onSelectPortfolio={handleSelectPortfolio}
        railExpanded={railExpanded}
        onToggleRail={() => setRailExpanded((prev) => !prev)}
        projectsCount={projects.length}
        totalStaleCount={totalStaleCount}
        onOpenDailyCheckin={onOpenDailyCheckin}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
      />

      {/* 2. BACKDROP SI ESTÁ EN TABLET OVERLAY */}
      {isTablet && view === 'portfolio' && projectsPanelOpen && (
        <div
          className="panel-backdrop"
          onClick={() => setProjectsPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. PANEL ACOPLADO DE PROYECTOS (Solo se muestra en 'Mis Proyectos' cuando projectsPanelOpen es true) */}
      {view === 'portfolio' && projectsPanelOpen && (
        <SidePanel
          space={space}
          onSpaceChange={onSpaceChange}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
          onClosePanel={() => setProjectsPanelOpen(false)}
          isOverlay={isTablet}
          onCreatePersonalProject={onCreatePersonalProject}
        />
      )}

      {/* 4. CONTENIDO FLUIDO PRINCIPAL */}
      <main className="app-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
