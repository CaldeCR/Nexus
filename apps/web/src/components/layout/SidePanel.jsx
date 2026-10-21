import React, { useState, useMemo } from 'react';
import { NavIcons } from './NavIcons';

export function SidePanel({
  space = 'all',
  onSpaceChange,
  projects = [],
  selectedProjectId,
  onSelectProject,
  onClosePanel,
  isOverlay = false,
  onCreatePersonalProject
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFinalized, setShowFinalized] = useState(false);

  // Proyectos agrupados por espacio
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (space === 'work') return p.space !== 'personal';
      if (space === 'personal') return p.space === 'personal';
      return true;
    });
  }, [projects, space, searchTerm]);

  // Separar Activos vs Finalizados
  const activeProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.status !== 'completed');
  }, [filteredProjects]);

  const finalizedProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.status === 'completed');
  }, [filteredProjects]);

  const workProjects = useMemo(() => {
    return activeProjects.filter((p) => p.space !== 'personal');
  }, [activeProjects]);

  const personalProjects = useMemo(() => {
    return activeProjects.filter((p) => p.space === 'personal');
  }, [activeProjects]);

  // Si el usuario busca algo que coincide con un finalizado, o selecciona uno, desplegarlo
  React.useEffect(() => {
    if (selectedProjectId && finalizedProjects.some((p) => p.id === selectedProjectId)) {
      setShowFinalized(true);
    }
  }, [selectedProjectId, finalizedProjects]);

  React.useEffect(() => {
    if (searchTerm.trim() && finalizedProjects.length > 0) {
      setShowFinalized(true);
    }
  }, [searchTerm, finalizedProjects.length]);

  const tagColors = [
    'var(--tag-1)',
    'var(--tag-2)',
    'var(--tag-3)',
    'var(--tag-4)',
    'var(--tag-5)',
    'var(--tag-6)'
  ];

  return (
    <aside className="side-panel" id="side-panel" aria-label="Espacios y proyectos">
      {/* 1. CABECERA DEL PANEL */}
      <div className="side-panel-header">
        <div className="side-panel-brand">
          <h2 className="side-panel-title">Proyectos</h2>
          <span className="side-panel-subtitle">Espacios y portafolio</span>
        </div>
        <button
          type="button"
          className="side-panel-close-btn"
          onClick={onClosePanel}
          title="Cerrar panel lateral ([)"
          aria-label="Cerrar panel lateral"
        >
          <NavIcons.Close size={16} />
        </button>
      </div>

      {/* 2. SELECTOR DE ESPACIO (TODOS / TRABAJO / PERSONAL) */}
      <div className="side-panel-space-row">
        <div className="segmented-control" role="group" aria-label="Selector de espacio">
          <button
            type="button"
            className={`segmented-btn ${space === 'all' ? 'is-active' : ''}`}
            onClick={() => onSpaceChange('all')}
            aria-pressed={space === 'all'}
          >
            Todos
          </button>
          <button
            type="button"
            className={`segmented-btn ${space === 'work' ? 'is-active' : ''}`}
            onClick={() => onSpaceChange('work')}
            aria-pressed={space === 'work'}
          >
            Trabajo
          </button>
          <button
            type="button"
            className={`segmented-btn ${space === 'personal' ? 'is-active' : ''}`}
            onClick={() => onSpaceChange('personal')}
            aria-pressed={space === 'personal'}
          >
            Personal
          </button>
        </div>
      </div>

      {/* 3. BUSCADOR DE PROYECTOS */}
      <div className="side-panel-search-row">
        <div className="side-panel-search-box">
          <span className="side-panel-search-icon">
            <NavIcons.Search size={14} />
          </span>
          <input
            type="text"
            className="side-panel-search-input"
            placeholder="Buscar proyecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar proyectos por nombre o código"
          />
        </div>
      </div>

      {/* 4. CUERPO DEL PANEL: PROYECTOS */}
      <div className="side-panel-body">
        {/* Opción global: Todos los proyectos */}
        <button
          type="button"
          className={`side-panel-all-btn ${!selectedProjectId ? 'is-active' : ''}`}
          onClick={() => onSelectProject(null)}
        >
          <span>Todos los proyectos</span>
          <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>({projects.length})</span>
        </button>

        {/* GRUPO TRABAJO */}
        {(space === 'all' || space === 'work') && (
          <div>
            <h3 className="side-group-title">
              Trabajo · {projects[0]?.organization || 'Empresa'}
            </h3>
            <div className="side-project-list">
              {workProjects.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: 'var(--text-xs)', color: 'var(--ink-500)', fontStyle: 'italic' }}>
                  No hay proyectos de trabajo
                </div>
              ) : (
                workProjects.map((p, idx) => {
                  const isSelected = selectedProjectId === p.id;
                  const tagBg = tagColors[idx % tagColors.length];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`side-project-item ${isSelected ? 'is-active' : ''}`}
                      onClick={() => onSelectProject(p.id)}
                      title={`${p.code ? p.code + ' · ' : ''}${p.name} (${p.progressPct || 0}%)`}
                    >
                      <span className="side-project-code-tag" style={{ background: tagBg }}>
                        {p.code || `P${idx + 1}`}
                      </span>
                      <span className="side-project-name">{p.name}</span>
                      <span className="side-project-pct">{p.progressPct || 0}%</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* GRUPO PERSONAL */}
        {(space === 'all' || space === 'personal') && (
          <div>
            <h3 className="side-group-title">Personal</h3>
            <div className="side-project-list">
              {personalProjects.length === 0 ? (
                <div style={{ padding: '4px 6px' }}>
                  <button
                    type="button"
                    className="side-create-personal-btn"
                    onClick={onCreatePersonalProject}
                  >
                    <NavIcons.Plus size={14} />
                    <span>Crear proyecto personal</span>
                  </button>
                </div>
              ) : (
                personalProjects.map((p, idx) => {
                  const isSelected = selectedProjectId === p.id;
                  const tagBg = tagColors[(idx + 3) % tagColors.length];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`side-project-item ${isSelected ? 'is-active' : ''}`}
                      onClick={() => onSelectProject(p.id)}
                      title={`${p.code ? p.code + ' · ' : ''}${p.name} (${p.progressPct || 0}%)`}
                    >
                      <span className="side-project-code-tag" style={{ background: tagBg }}>
                        {p.code || `P${idx + 1}`}
                      </span>
                      <span className="side-project-name">{p.name}</span>
                      <span className="side-project-pct">{p.progressPct || 0}%</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. SECCIÓN COLAPSABLE: PROYECTOS FINALIZADOS */}
        {finalizedProjects.length > 0 && (
          <div className="side-finalized-group">
            <button
              type="button"
              className="side-finalized-toggle-btn"
              onClick={() => setShowFinalized(!showFinalized)}
              aria-expanded={showFinalized}
              title={showFinalized ? 'Ocultar proyectos finalizados' : 'Desplegar proyectos finalizados'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="side-finalized-icon">
                  <NavIcons.CheckCircle size={15} />
                </span>
                <span className="side-finalized-title">Proyectos Finalizados</span>
                <span className="side-finalized-count">({finalizedProjects.length})</span>
              </div>
              <span className="side-finalized-chevron">
                {showFinalized ? <NavIcons.ChevronDown size={14} /> : <NavIcons.ChevronRight size={14} />}
              </span>
            </button>

            {showFinalized && (
              <div className="side-project-list is-finalized">
                {finalizedProjects.map((p, idx) => {
                  const isSelected = selectedProjectId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`side-project-item is-finalized ${isSelected ? 'is-active' : ''}`}
                      onClick={() => onSelectProject(p.id)}
                      title={`${p.code ? p.code + ' · ' : ''}${p.name} (Finalizado)`}
                    >
                      <span className="side-project-code-tag is-done">
                        {p.code || `P${idx + 1}`}
                      </span>
                      <span className="side-project-name">{p.name}</span>
                      <span className="side-project-pct is-done">✓ 100%</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
