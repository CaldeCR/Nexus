import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { NavIcons } from '../components/layout/NavIcons';

export function KanbanView({
  workItems = [],
  projects = [],
  selectedProjectId = null,
  onSelectProject,
  currentUser = null,
  todayStr = '',
  onUpdateWorkItem,
  onEditTask,
  onOpenNewTask,
  onOpenStatusModal,
  onDeleteTask
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [activeCol, setActiveCol] = useState('in_progress'); // For mobile column slider
  const [whoFilter, setWhoFilter] = useState(null); // Assignee filter
  const [onlyLate, setOnlyLate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [movingTaskId, setMovingTaskId] = useState(null);

  // Status column metadata matching Figma master
  const columnsMeta = {
    backlog: { id: 'backlog', title: 'Pendiente', dot: '#9AA4AC' },
    in_progress: { id: 'in_progress', title: 'En curso', dot: '#2A6F62' },
    review: { id: 'review', title: 'Validación', dot: '#B98A1E' },
    done: { id: 'done', title: 'Hecho', dot: '#4C8A45' }
  };

  // Color tones for projects & avatars
  const projectToneMap = useMemo(() => {
    const tones = ['#2A6F62', '#4A6B7A', '#0F3446', '#5C6670', '#7A5C3E', '#4C8A45', '#B98A1E'];
    const map = {};
    projects.forEach((p, idx) => {
      map[p.id] = tones[idx % tones.length];
      if (p.code) map[p.code] = tones[idx % tones.length];
    });
    return map;
  }, [projects]);

  const avatarTones = {
    'Jorge': '#2A6F62',
    'Jerry Contabilidad': '#7A5C3E',
    'Jean Paul TI': '#0F3446',
    'Jean Paul': '#0F3446',
    'Josué B': '#4A6B7A',
    'Max-Redinet': '#5C6670',
    'Marco': '#0F3446',
    'Esteban Montoya': '#2A6F62'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(/[\s-]+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Selected project object
  const currentProject = selectedProjectId ? projectMap[selectedProjectId] : null;

  // Filter tasks based on selected project, search, assignee, overdue
  const processedTasks = useMemo(() => {
    return workItems.map((task) => {
      const proj = projectMap[task.projectId] || { name: 'Sin proyecto', code: 'PRJ' };
      const tone = projectToneMap[task.projectId] || '#2A6F62';

      // Check if overdue
      let isLate = false;
      if (task.status !== 'done' && task.dueDate && todayStr) {
        isLate = task.dueDate < todayStr;
      }

      // Normalized assignees
      const assignees = Array.isArray(task.assignees) && task.assignees.length > 0
        ? task.assignees
        : (task.assignee ? [task.assignee] : ['Jorge']);

      // Format date
      let dateText = 'Sin fecha';
      if (task.dueDate) {
        const parts = task.dueDate.split('-');
        if (parts.length === 3) {
          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          const mIdx = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          dateText = `${day} ${months[mIdx] || ''}`;
        }
      }

      const displayDate = isLate ? `Venció ${dateText}` : dateText;

      return {
        ...task,
        project: proj,
        projName: proj.name,
        projTone: tone,
        assigneesList: assignees,
        isLate,
        displayDate
      };
    });
  }, [workItems, projectMap, projectToneMap, todayStr]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return processedTasks.filter((t) => {
      if (selectedProjectId && String(t.projectId) !== String(selectedProjectId)) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(term);
        const matchCode = (t.code || '').toLowerCase().includes(term);
        const matchProj = (t.projName || '').toLowerCase().includes(term);
        if (!matchTitle && !matchCode && !matchProj) return false;
      }
      if (whoFilter) {
        const hasWho = t.assigneesList.some((a) => {
          if (whoFilter === 'Jean Paul' && (a === 'Jean Paul TI' || a === 'Jean Paul')) return true;
          return a === whoFilter;
        });
        if (!hasWho) return false;
      }
      if (onlyLate) {
        if (!t.isLate) return false;
      }
      return true;
    });
  }, [processedTasks, selectedProjectId, searchTerm, whoFilter, onlyLate]);

  // Group filtered tasks by column
  const tasksByColumn = useMemo(() => {
    const groups = { backlog: [], in_progress: [], review: [], done: [] };
    filteredTasks.forEach((t) => {
      const st = t.status || 'backlog';
      if (groups[st]) {
        groups[st].push(t);
      } else {
        groups.backlog.push(t);
      }
    });
    return groups;
  }, [filteredTasks]);

  // People available for filter
  const candidatePeople = useMemo(() => {
    const set = new Set();
    processedTasks.forEach((t) => {
      t.assigneesList.forEach((a) => {
        if (a === 'Jean Paul TI') set.add('Jean Paul');
        else if (a) set.add(a);
      });
    });
    const list = Array.from(set);
    return list.slice(0, 5); // top 5
  }, [processedTasks]);

  const hasActiveFilters = Boolean(searchTerm || whoFilter || onlyLate || selectedProjectId);

  const clearFilters = () => {
    setSearchTerm('');
    setWhoFilter(null);
    setOnlyLate(false);
    if (onSelectProject) onSelectProject(null);
  };

  // Move task to a different status
  const handleMoveStatus = (task, newStatus) => {
    if (task.status === newStatus) return;
    if (newStatus === 'done') {
      // Prompt for completion report if needed (§7.4.1)
      const report = window.prompt('Reporte de cierre obligatorio (mínimo 20 caracteres):', `Tarea completada con éxito.`);
      if (!report || report.trim().length < 20) {
        alert('Para marcar una tarea como Hecha, el reporte de cierre debe tener al menos 20 caracteres.');
        return;
      }
      onUpdateWorkItem(task.id, {
        status: 'done',
        closeType: 'successful',
        completionReport: report.trim(),
        closedAt: new Date().toISOString()
      });
    } else {
      onUpdateWorkItem(task.id, { status: newStatus });
    }
    setMovingTaskId(null);
  };

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px)                                                    */
  /* ========================================================================= */
  if (isMobile) {
    const activeCards = tasksByColumn[activeCol] || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#F6F7F7', color: '#1D2A33' }}>
        {/* Selector de Proyecto & Botón Vencidas */}
        <div style={{ flex: 'none', background: '#FFFFFF', borderBottom: '1px solid #DDE2E4', padding: '12px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Proyecto</span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => onSelectProject(e.target.value ? e.target.value : null)}
                style={{ height: '40px', border: '1px solid #DDE2E4', borderRadius: '6px', background: '#FFFFFF', padding: '0 10px', font: 'inherit', color: '#1D2A33' }}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ''}{p.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-pressed={onlyLate}
              onClick={() => setOnlyLate(!onlyLate)}
              style={{
                height: '40px',
                padding: '0 12px',
                border: onlyLate ? '2px solid #9B3B32' : '1px solid #DDE2E4',
                borderRadius: '6px',
                background: onlyLate ? '#FBEBEA' : '#FFFFFF',
                color: onlyLate ? '#9B3B32' : '#5F6B76',
                font: 'inherit',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Vencidas
            </button>
          </div>

          {/* Slider de Pestañas / Columnas */}
          <div role="tablist" aria-label="Columnas" style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
            {Object.keys(columnsMeta).map((k) => {
              const colMeta = columnsMeta[k];
              const isSelected = activeCol === k;
              const count = (tasksByColumn[k] || []).length;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCol(k)}
                  style={{
                    flex: 'none',
                    height: '44px',
                    padding: '0 2px',
                    marginBottom: '-1px',
                    border: 0,
                    borderBottom: isSelected ? '2px solid #2A6F62' : '2px solid transparent',
                    background: 'transparent',
                    font: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    color: isSelected ? '#1D2A33' : '#5F6B76'
                  }}
                >
                  <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', marginRight: '6px', background: colMeta.dot }} />
                  {colMeta.title} <span style={{ color: '#5F6B76', fontWeight: 400, marginLeft: '4px' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Tarjetas Móvil */}
        <div style={{ flex: 1, padding: '14px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
          {activeCards.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5F6B76', fontSize: '13px' }}>
              No hay tareas en esta columna con los filtros actuales.
            </div>
          ) : (
            activeCards.map((c) => {
              const isDone = c.status === 'done';
              const isHigh = c.priority === 'high' && !isDone;

              return (
                <article
                  key={c.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E1E5E6',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.projTone, flex: 'none' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{c.projName}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontWeight: 500 }}>{c.code || `T-${c.id}`}</span>
                  </div>

                  <div
                    style={{
                      fontSize: '15px',
                      lineHeight: '21px',
                      fontWeight: 500,
                      color: isDone ? '#5F6B76' : '#1D2A33',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}
                  >
                    {c.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    {isHigh && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#7A4A12', fontWeight: 600 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        Alta
                      </span>
                    )}

                    <span style={{ whiteSpace: 'nowrap', color: c.isLate ? '#9B3B32' : '#5F6B76', fontWeight: c.isLate ? 600 : 400 }}>
                      {c.displayDate}
                    </span>

                    <span style={{ flex: 1 }} />

                    {/* Avatares */}
                    <div style={{ display: 'flex' }}>
                      {c.assigneesList.map((n, i) => (
                        <span
                          key={n + i}
                          title={n}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid #FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            background: avatarTones[n] || '#5C6670',
                            marginLeft: i ? '-6px' : '0'
                          }}
                        >
                          {getInitials(n)}
                        </span>
                      ))}
                    </div>

                    {/* Botón Editar Móvil */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask && onEditTask(c);
                      }}
                      aria-label="Editar tarea"
                      title="Editar tarea"
                      style={{
                        height: '32px',
                        padding: '0 8px',
                        border: '1px solid #DDE2E4',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        color: '#3A4650',
                        font: 'inherit',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <NavIcons.Edit size={13} />
                    </button>

                    {/* Botón Mover */}
                    <button
                      type="button"
                      onClick={() => setMovingTaskId(movingTaskId === c.id ? null : c.id)}
                      aria-label="Mover tarea a otra columna"
                      style={{
                        height: '32px',
                        padding: '0 10px',
                        border: '1px solid #DDE2E4',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        color: '#3A4650',
                        font: 'inherit',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Mover
                    </button>
                  </div>

                  {/* Selector rápido para mover columna si está abierto */}
                  {movingTaskId === c.id && (
                    <div style={{ display: 'flex', gap: '6px', background: '#F6F7F7', padding: '8px', borderRadius: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {Object.keys(columnsMeta).map((targetCol) => {
                        if (targetCol === c.status) return null;
                        return (
                          <button
                            key={targetCol}
                            type="button"
                            onClick={() => handleMoveStatus(c, targetCol)}
                            style={{
                              flex: 1,
                              minWidth: '70px',
                              height: '30px',
                              background: '#FFFFFF',
                              border: '1px solid #DDE2E4',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: columnsMeta[targetCol].dot,
                              cursor: 'pointer'
                            }}
                          >
                            → {columnsMeta[targetCol].title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET (§7.2)                                          */
  /* ========================================================================= */
  return (
    <div style={{ flex: 1, minWidth: 0, padding: bp === 'tablet' ? '24px 28px' : '32px 40px 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <nav aria-label="Ruta" style={{ fontSize: '13px', color: '#5F6B76' }}>
            <span style={{ cursor: 'pointer', color: '#5F6B76' }} onClick={() => onSelectProject(null)}>Mis proyectos</span>
            {' / '}
            <span>{currentProject ? currentProject.name : 'Todos'}</span>
          </nav>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#1D2A33' }}>Tablero</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentProject && (
            <button
              type="button"
              onClick={() => onOpenStatusModal(currentProject)}
              style={{
                height: '40px',
                padding: '0 16px',
                border: '1px solid #DDE2E4',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#1D2A33',
                font: 'inherit',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Estatus del proyecto
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewTask}
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
            Nueva tarea
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        {/* Buscador */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '6px', padding: '0 12px', height: '36px', width: '220px', boxSizing: 'border-box', color: '#5F6B76' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Buscar tareas</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tareas"
            style={{ border: 0, outline: 'none', background: 'transparent', font: 'inherit', color: '#1D2A33', flex: 1, minWidth: 0 }}
          />
        </label>

        {/* Filtro por Personas */}
        <div style={{ display: 'flex' }} role="group" aria-label="Filtrar por responsable">
          {candidatePeople.map((n, i) => {
            const isSelected = whoFilter === n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Filtrar por ${n}`}
                aria-pressed={isSelected}
                onClick={() => setWhoFilter(isSelected ? null : n)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #1D2A33' : '2px solid #F6F7F7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: 'inherit',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  zIndex: isSelected ? 2 : 1,
                  opacity: whoFilter && !isSelected ? 0.55 : 1,
                  background: avatarTones[n] || '#5C6670',
                  marginLeft: i ? '-6px' : '0'
                }}
              >
                {getInitials(n)}
              </button>
            );
          })}
        </div>

        {/* Solo Vencidas */}
        <button
          type="button"
          aria-pressed={onlyLate}
          onClick={() => setOnlyLate(!onlyLate)}
          style={{
            height: '36px',
            padding: '0 12px',
            border: onlyLate ? '2px solid #9B3B32' : '1px solid #DDE2E4',
            borderRadius: '6px',
            background: onlyLate ? '#FBEBEA' : '#FFFFFF',
            color: onlyLate ? '#9B3B32' : '#5F6B76',
            font: 'inherit',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Solo vencidas
        </button>

        {/* Botón Limpiar */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              height: '36px',
              padding: '0 8px',
              border: 0,
              background: 'transparent',
              color: '#2A6F62',
              font: 'inherit',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Grid de 4 Columnas */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {Object.keys(columnsMeta).map((colKey) => {
            const col = columnsMeta[colKey];
            const cards = tasksByColumn[colKey] || [];

            return (
              <section
                key={colKey}
                aria-label={col.title}
                style={{
                  background: '#EDF0F0',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '560px'
                }}
              >
                {/* Cabecera de Columna */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 4px 6px 4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dot }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D2A33' }}>{col.title}</span>
                  <span style={{ fontSize: '13px', color: '#5F6B76' }}>{cards.length}</span>
                </div>

                {/* Lista de Tarjetas */}
                {cards.map((c) => {
                  const isDone = colKey === 'done';
                  const isHigh = c.priority === 'high' && !isDone;

                  return (
                    <article
                      key={c.id}
                      onClick={() => onEditTask && onEditTask(c)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E1E5E6',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: 'none',
                        cursor: onEditTask ? 'pointer' : 'default',
                        transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      {/* Proyecto & Tag + Botón Editar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', flex: 'none', background: c.projTone }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.projName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask && onEditTask(c);
                          }}
                          title="Editar tarea"
                          style={{
                            background: 'transparent',
                            border: 0,
                            padding: '2px 4px',
                            color: '#5F6B76',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <NavIcons.Edit size={13} />
                        </button>
                      </div>

                      {/* Título */}
                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: '20px',
                          fontWeight: 500,
                          color: isDone ? '#5F6B76' : '#1D2A33',
                          textDecoration: isDone ? 'line-through' : 'none',
                          textDecorationColor: '#9AA4AC'
                        }}
                      >
                        {c.title}
                      </div>

                      {/* Fila Inferior */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                        <span style={{ color: '#5F6B76', fontWeight: 500 }}>{c.code || `T-${c.id}`}</span>

                        {isHigh && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#7A4A12', fontWeight: 600 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                            Alta
                          </span>
                        )}

                        <span style={{ whiteSpace: 'nowrap', color: c.isLate ? '#9B3B32' : '#5F6B76', fontWeight: c.isLate ? 600 : 400 }}>
                          {c.displayDate}
                        </span>

                        <span style={{ flex: 1 }} />

                        {/* Avatares */}
                        <div style={{ display: 'flex' }}>
                          {c.assigneesList.map((n, i) => (
                            <span
                              key={n + i}
                              title={n}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: '2px solid #FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                background: avatarTones[n] || '#5C6670',
                                marginLeft: i ? '-6px' : '0'
                              }}
                            >
                              {getInitials(n)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Botón Añadir Tarea */}
                <button
                  type="button"
                  onClick={onOpenNewTask}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '36px',
                    padding: '0 6px',
                    border: 0,
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#5F6B76',
                    font: 'inherit',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Añadir tarea
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
