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
  onDeleteTask,
  onUpdateProject
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [activeCol, setActiveCol] = useState('in_progress'); // For mobile column slider
  const [whoFilter, setWhoFilter] = useState(null); // Assignee filter
  const [onlyLate, setOnlyLate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [movingTaskId, setMovingTaskId] = useState(null);

  // Estados para proyectos gestionados por fases (Alt 1 + Alt 3)
  const [expandedPhaseIds, setExpandedPhaseIds] = useState(() => new Set());
  const [highlightedPhaseId, setHighlightedPhaseId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [isPhasesDrawerOpen, setIsPhasesDrawerOpen] = useState(false);
  const [editingPhases, setEditingPhases] = useState([]);

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

  // Determinar si el proyecto actual está configurado para gestión por fases
  const isPhasedProject = Boolean(
    currentProject &&
    currentProject.hasPhases &&
    Array.isArray(currentProject.phases) &&
    currentProject.phases.length > 0
  );

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

  // Métodos de interacción con fases (Alt 1 + Alt 3)
  const togglePhaseAccordion = (phaseId) => {
    setExpandedPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const expandAllPhases = (expand) => {
    if (!currentProject?.phases) return;
    if (expand) {
      setExpandedPhaseIds(new Set(currentProject.phases.map((p) => p.id)));
    } else {
      setExpandedPhaseIds(new Set());
    }
  };

  const scrollToAndOpenPhase = (phaseId, taskId = null) => {
    setExpandedPhaseIds((prev) => new Set([...prev, phaseId]));
    setHighlightedPhaseId(phaseId);

    setTimeout(() => {
      const el = document.getElementById(`phase-card-${phaseId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);

    setTimeout(() => {
      setHighlightedPhaseId(null);
    }, 2400);

    if (taskId) {
      setHighlightedTaskId(taskId);
      setTimeout(() => {
        const tEl = document.getElementById(`task-card-${taskId}`);
        if (tEl) {
          tEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 350);

      setTimeout(() => {
        setHighlightedTaskId(null);
      }, 2600);
    }
  };

  const openPhasesManager = () => {
    if (!currentProject?.phases) return;
    setEditingPhases(
      currentProject.phases.map((p, idx) => {
        let defaultStart = p.startDate;
        if (!defaultStart) {
          if (idx === 0) {
            defaultStart = currentProject.startDate || todayStr || '';
          } else {
            defaultStart = currentProject.phases[idx - 1]?.targetDate || todayStr || '';
          }
        }
        return {
          id: p.id,
          name: p.name,
          startDate: defaultStart || '',
          targetDate: p.targetDate || '',
          status: p.status || 'pending'
        };
      })
    );
    setIsPhasesDrawerOpen(true);
  };

  const handleAddPhaseInManager = () => {
    const nextNum = editingPhases.length + 1;
    const lastPhase = editingPhases[editingPhases.length - 1];
    const defaultStart = lastPhase?.targetDate || todayStr || '';
    let defaultTarget = '';
    if (defaultStart) {
      const d = new Date(defaultStart + 'T12:00:00');
      d.setDate(d.getDate() + 21);
      defaultTarget = d.toISOString().split('T')[0];
    }
    setEditingPhases((prev) => [
      ...prev,
      {
        id: `phase-${Date.now()}-${nextNum}`,
        name: `Fase ${nextNum}: `,
        startDate: defaultStart,
        targetDate: defaultTarget,
        status: 'pending'
      }
    ]);
  };

  const handleUpdatePhaseInManager = (idx, field, value) => {
    setEditingPhases((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleRemovePhaseInManager = (idx) => {
    if (editingPhases.length <= 1) {
      alert('El proyecto debe mantener al menos una fase.');
      return;
    }
    setEditingPhases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSavePhasesManager = () => {
    const cleaned = editingPhases.map((p, idx) => ({
      ...p,
      name: p.name.trim() || `Fase ${idx + 1}`,
      startDate: p.startDate || '',
      targetDate: p.targetDate || ''
    }));
    if (onUpdateProject) {
      onUpdateProject(currentProject.id, {
        ...currentProject,
        hasPhases: true,
        phases: cleaned
      });
    }
    setIsPhasesDrawerOpen(false);
  };

  // Helper de duración en días / semanas
  const formatDurationDays = (startStr, endStr) => {
    if (!startStr || !endStr) return '';
    const d1 = new Date(startStr + 'T12:00:00').getTime();
    const d2 = new Date(endStr + 'T12:00:00').getTime();
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Invertida';
    if (diff === 0) return '1 día';
    if (diff < 7) return `${diff}d`;
    const w = Math.round(diff / 7);
    return `${diff}d (~${w}s)`;
  };

  // Cálculo Dinámico de la Línea de Tiempo Gantt según fechas reales del proyecto, fases y tareas
  const timelineConfig = useMemo(() => {
    const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const curToday = todayStr || new Date().toISOString().split('T')[0];

    // Recolectar todas las fechas existentes para determinar el rango real
    const allDates = [curToday];
    if (currentProject?.startDate) allDates.push(currentProject.startDate);
    if (currentProject?.targetDate) allDates.push(currentProject.targetDate);

    (currentProject?.phases || []).forEach((ph) => {
      if (ph.startDate) allDates.push(ph.startDate);
      if (ph.targetDate) allDates.push(ph.targetDate);
    });

    (filteredTasks || []).forEach((t) => {
      if (t.startDate) allDates.push(t.startDate);
      if (t.dueDate) allDates.push(t.dueDate);
      if (t.createdAt) allDates.push(t.createdAt.split('T')[0]);
    });

    const timestamps = allDates
      .map((dStr) => {
        if (!dStr || typeof dStr !== 'string') return null;
        const parts = dStr.split('-').map(Number);
        if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      })
      .filter((ts) => ts !== null && !isNaN(ts));

    const minTs = timestamps.length > 0 ? Math.min(...timestamps) : new Date().getTime();
    const maxTs = timestamps.length > 0 ? Math.max(...timestamps) : new Date().getTime();

    const minD = new Date(minTs);
    const maxD = new Date(maxTs);

    let startYear = minD.getFullYear();
    let startMonth = minD.getMonth();
    let endYear = maxD.getFullYear();
    let endMonth = maxD.getMonth();

    // Garantizar al menos 4 meses para balance visual
    let monthCount = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    if (monthCount < 4) {
      const needed = 4 - monthCount;
      const addBefore = Math.floor(needed / 2);
      const addAfter = needed - addBefore;

      startMonth -= addBefore;
      while (startMonth < 0) {
        startMonth += 12;
        startYear -= 1;
      }
      endMonth += addAfter;
      while (endMonth > 11) {
        endMonth -= 12;
        endYear += 1;
      }
    }

    const todayParts = curToday.split('-').map(Number);
    const todayYear = todayParts[0];
    const todayMonth = todayParts[1] - 1;
    const todayDay = todayParts[2];

    const cols = [];
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const isCur = curY === todayYear && curM === todayMonth;
      const daysInMonth = new Date(curY, curM + 1, 0).getDate();
      const todayDayPct = isCur ? Math.max(2, Math.min(98, (todayDay / daysInMonth) * 100)) : 50;

      cols.push({
        year: curY,
        month: curM,
        label: `${monthsShort[curM]} ${curY}`,
        isCurrent: isCur,
        todayLabel: `Hoy ${todayDay} ${monthsShort[todayMonth]}`,
        todayDayPct,
        daysInMonth
      });

      curM++;
      if (curM > 11) {
        curM = 0;
        curY++;
      }
    }

    const timelineStartMs = new Date(startYear, startMonth, 1, 0, 0, 0).getTime();
    const timelineEndMs = new Date(endYear, endMonth + 1, 0, 23, 59, 59).getTime();
    const totalDurationMs = Math.max(1, timelineEndMs - timelineStartMs);

    const todayMs = new Date(todayYear, todayMonth, todayDay, 12, 0, 0).getTime();
    let todayTimelinePct = null;
    if (todayMs >= timelineStartMs && todayMs <= timelineEndMs) {
      todayTimelinePct = Math.max(0.5, Math.min(99.5, ((todayMs - timelineStartMs) / totalDurationMs) * 100));
    }

    return {
      months: cols,
      timelineStartMs,
      timelineEndMs,
      totalDurationMs,
      todayTimelinePct
    };
  }, [todayStr, currentProject, filteredTasks]);

  // Posicionamiento de Fases en Gantt con Fechas Reales
  const getPhasePosition = (phase, idx, totalPhases) => {
    const { timelineStartMs, totalDurationMs } = timelineConfig;

    let startStr = phase.startDate;
    if (!startStr) {
      if (idx === 0) {
        if (currentProject?.startDate && currentProject.startDate <= (phase.targetDate || todayStr)) {
          const pStart = new Date(currentProject.startDate + 'T12:00:00').getTime();
          const pTarget = phase.targetDate ? new Date(phase.targetDate + 'T12:00:00').getTime() : pStart;
          if ((pTarget - pStart) / (1000 * 60 * 60 * 24) > 40) {
            const d = new Date(pTarget);
            d.setDate(d.getDate() - 14);
            startStr = d.toISOString().split('T')[0];
          } else {
            startStr = currentProject.startDate;
          }
        } else {
          startStr = todayStr || '2026-10-27';
        }
      } else {
        const prevPhase = currentProject?.phases?.[idx - 1];
        startStr = prevPhase?.targetDate || todayStr;
      }
    }

    let endStr = phase.targetDate || startStr;
    if (endStr < startStr) {
      endStr = startStr;
    }

    const startParts = (startStr || '2026-10-27').split('-').map(Number);
    const endParts = (endStr || '2026-11-04').split('-').map(Number);

    const startMs = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0).getTime();
    const endMs = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59).getTime();

    const leftPct = Math.max(0, Math.min(95, ((startMs - timelineStartMs) / totalDurationMs) * 100));
    const rightPct = Math.max(leftPct + 4, Math.min(100, ((endMs - timelineStartMs) / totalDurationMs) * 100));
    const widthPct = Math.max(5, rightPct - leftPct);
    const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

    return {
      left: `${leftPct.toFixed(2)}%`,
      width: `${widthPct.toFixed(2)}%`,
      startDate: startStr,
      targetDate: endStr,
      durationDays: diffDays
    };
  };

  // Posicionamiento de Tareas en Gantt con Fechas Reales
  const getTaskPosition = (task, phasePos, tIdx, totalTasks, isShared) => {
    const { timelineStartMs, totalDurationMs } = timelineConfig;

    let startStr = task.startDate || (task.createdAt ? task.createdAt.split('T')[0] : '') || phasePos.startDate;
    let endStr = task.dueDate || phasePos.targetDate || startStr;

    if (endStr < startStr) {
      endStr = startStr;
    }

    const startParts = (startStr || '2026-10-27').split('-').map(Number);
    const endParts = (endStr || '2026-11-04').split('-').map(Number);

    const startMs = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0).getTime();
    const endMs = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59).getTime();

    let leftPct = ((startMs - timelineStartMs) / totalDurationMs) * 100;
    let rightPct = ((endMs - timelineStartMs) / totalDurationMs) * 100;

    leftPct = Math.max(0, Math.min(96, leftPct));
    rightPct = Math.max(leftPct + 3, Math.min(100, rightPct));
    const widthPct = Math.max(3.5, rightPct - leftPct);

    return {
      left: `${leftPct.toFixed(2)}%`,
      width: `${widthPct.toFixed(2)}%`,
      startDate: startStr,
      dueDate: endStr
    };
  };

  const renderTaskCardItem = (c, phaseId = null) => {
    const isDone = c.status === 'done';
    const isHigh = c.priority === 'high' && !isDone;
    const isShared = (c.phaseIds || []).length > 1;
    const isHighlighted = highlightedTaskId === c.id;

    const otherPhasesText = isShared && phaseId && currentProject?.phases
      ? (c.phaseIds || [])
          .filter((id) => id !== phaseId)
          .map((id) => {
            const ph = currentProject.phases.find((p) => p.id === id);
            return ph ? ph.name.split(':')[0] : 'Fase';
          })
          .join(', ')
      : '';

    return (
      <article
        key={`${c.id}-${phaseId || 'global'}`}
        id={`task-card-${c.id}`}
        onClick={() => onEditTask && onEditTask(c)}
        className={`kanban-task-card ${isShared ? 'is-shared-task' : ''} ${isHighlighted ? 'task-highlight-pulse' : ''}`}
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
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          position: 'relative'
        }}
      >
        {/* Proyecto / Fases & Tag + Botón Editar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', flex: 'none', background: c.projTone }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{c.projName}</span>
            {isShared && (
              <span
                className="shared-pill-tag"
                title={otherPhasesText ? `Compartida con: ${otherPhasesText}` : 'Compartida entre fases'}
              >
                🔗 {otherPhasesText ? `+ ${otherPhasesText}` : 'Compartida'}
              </span>
            )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
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
            <>
              {isPhasedProject && (
                <button
                  type="button"
                  onClick={openPhasesManager}
                  style={{
                    height: '40px',
                    padding: '0 14px',
                    border: '1px solid #2A6F62',
                    borderRadius: '6px',
                    background: 'rgba(42, 111, 98, 0.08)',
                    color: '#2A6F62',
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚙️</span> Fases ({currentProject.phases.length})
                </button>
              )}
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
            </>
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

      {/* Renderizado Condicional: Proyecto por Fases (Alt 1 + Alt 3) vs. Tablero Continuo Tradicional */}
      {isPhasedProject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. SECCIÓN SUPERIOR: CRONOGRAMA GANTT (Alt 3 - Imagen 2) */}
          <section aria-label="Cronograma de Fases y Tareas" className="phased-gantt-container">
            <div className="phased-gantt-header">
              <div className="phased-gantt-title-row">
                <span style={{ fontSize: '16px' }}>📊</span>
                <span>Cronograma de Fases y Tareas (Gantt)</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#5F6B76', marginLeft: '6px' }}>
                  Haz clic en cualquier fase o tarea para abrirla en el tablero abajo
                </span>
              </div>
              <div className="phased-gantt-legend">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#19463c' }} />
                  Etapa Maestra
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#2A6F62' }} />
                  Tarea de Fase
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#47626D' }} />
                  Tarea Compartida (🔗)
                </span>
              </div>
            </div>

            {/* Encabezado de Meses con Marcador de Hoy y Filas Dinámicas */}
            <div style={{ overflowX: 'auto', border: '1px solid #E6EBED', borderRadius: '8px', background: '#FFFFFF' }}>
              <div
                className="phased-gantt-table-head"
                style={{
                  minWidth: `${320 + timelineConfig.months.length * 115}px`,
                  gridTemplateColumns: `320px repeat(${timelineConfig.months.length}, 1fr)`
                }}
              >
                <div className="phased-gantt-th first">Etapas y Tareas del Proyecto</div>
                {timelineConfig.months.map((m, mIdx) => (
                  <div key={mIdx} className={`phased-gantt-th ${m.isCurrent ? 'is-current' : ''}`}>
                    <span>{m.label} {m.isCurrent ? '(Actual)' : ''}</span>
                    {m.isCurrent && (
                      <div className="phased-today-pin" style={{ left: `${m.todayDayPct}%`, right: 'auto' }}>
                        <span className="phased-today-tag">{m.todayLabel}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Filas de Gantt */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {currentProject.phases.map((phase, pIdx) => {
                  const phaseTasks = filteredTasks.filter((t) => (t.phaseIds || []).includes(phase.id));
                  const phasePos = getPhasePosition(phase, pIdx, currentProject.phases.length);

                  return (
                    <React.Fragment key={phase.id}>
                      {/* Fila Maestra de Fase */}
                      <div
                        className="phased-gantt-row is-phase-head"
                        style={{
                          minWidth: `${320 + timelineConfig.months.length * 115}px`,
                          gridTemplateColumns: '320px 1fr'
                        }}
                        title={`Haz clic para ver ${phase.name} en el Tablero abajo`}
                        onClick={() => scrollToAndOpenPhase(phase.id)}
                      >
                        <div className="phased-gantt-row-title">
                          <span style={{ fontSize: '13px' }}>📌</span>
                          <span style={{ fontWeight: 700, color: '#2A6F62' }}>{phase.name}</span>
                          <span className="phased-goto-badge">Ver en tablero ⬇</span>
                        </div>
                        <div className="phased-gantt-track" style={{ position: 'relative', width: '100%' }}>
                          {/* Cuadrícula de Meses de Fondo */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'grid',
                              gridTemplateColumns: `repeat(${timelineConfig.months.length}, 1fr)`,
                              pointerEvents: 'none'
                            }}
                          >
                            {timelineConfig.months.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                style={{
                                  borderRight: '1px solid #EEF1F3',
                                  background: m.isCurrent ? 'rgba(42, 111, 98, 0.035)' : 'transparent',
                                  height: '100%'
                                }}
                              />
                            ))}
                          </div>

                          {/* Línea vertical de Hoy en el carril */}
                          {timelineConfig.todayTimelinePct !== null && (
                            <div
                              style={{
                                position: 'absolute',
                                left: `${timelineConfig.todayTimelinePct}%`,
                                top: 0,
                                bottom: 0,
                                width: '2px',
                                background: '#EF4444',
                                opacity: 0.35,
                                pointerEvents: 'none',
                                zIndex: 1
                              }}
                            />
                          )}

                          <div
                            className="phased-master-bar"
                            style={{ left: phasePos.left, width: phasePos.width, zIndex: 2 }}
                            title={`${phase.name} | Inicio: ${phasePos.startDate} → Meta: ${phasePos.targetDate} (${phasePos.durationDays} días)`}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {phase.name.split(':')[0]} • Meta: {phase.targetDate || 'Sin fecha'} ({phasePos.durationDays}d)
                            </span>
                            <span>{phase.status === 'completed' ? '✓' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tareas de la Fase en Gantt */}
                      {phaseTasks.map((task, tIdx) => {
                        const isShared = (task.phaseIds || []).length > 1;
                        const taskPos = getTaskPosition(task, phasePos, tIdx, phaseTasks.length, isShared);

                        return (
                          <div
                            key={`${phase.id}-${task.id}`}
                            className="phased-gantt-row"
                            style={{
                              cursor: 'pointer',
                              minWidth: `${320 + timelineConfig.months.length * 115}px`,
                              gridTemplateColumns: '320px 1fr'
                            }}
                            title={`Haz clic para ver la tarea ${task.code || ''} en el Tablero | Inicio: ${taskPos.startDate} → Límite: ${taskPos.dueDate}`}
                            onClick={() => scrollToAndOpenPhase(phase.id, task.id)}
                          >
                            <div className="phased-gantt-row-title" style={{ paddingLeft: '34px', fontSize: '12px', color: '#3A4650' }}>
                              {isShared ? <span style={{ color: '#47626D', fontSize: '13px' }}>🔗</span> : '•'}
                              <strong style={{ color: '#1D2A33' }}>{task.code || `T-${task.id}`}:</strong>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                            </div>
                            <div className="phased-gantt-track" style={{ position: 'relative', width: '100%' }}>
                              {/* Cuadrícula de Fondo */}
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${timelineConfig.months.length}, 1fr)`,
                                  pointerEvents: 'none'
                                }}
                              >
                                {timelineConfig.months.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    style={{
                                      borderRight: '1px solid #EEF1F3',
                                      background: m.isCurrent ? 'rgba(42, 111, 98, 0.035)' : 'transparent',
                                      height: '100%'
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Línea vertical de Hoy */}
                              {timelineConfig.todayTimelinePct !== null && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: `${timelineConfig.todayTimelinePct}%`,
                                    top: 0,
                                    bottom: 0,
                                    width: '2px',
                                    background: '#EF4444',
                                    opacity: 0.35,
                                    pointerEvents: 'none',
                                    zIndex: 1
                                  }}
                                />
                              )}

                              <div
                                className={`phased-task-bar ${isShared ? 'is-shared' : ''}`}
                                style={{ left: taskPos.left, width: taskPos.width, zIndex: 2 }}
                              >
                                <span>{task.code || ''} ({task.assigneesList?.[0] || 'Jorge'}) {isShared ? '★ Compartida' : ''}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 2. BARRA DE HERRAMIENTAS DE FASES */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1D2A33' }}>
                Fases del Proyecto ({currentProject.phases.length})
              </h2>
              <span style={{ fontSize: '12px', color: '#5F6B76' }}>
                Contraídas por defecto. Haz clic en una fase para desplegar sus 4 columnas Kanban.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => expandAllPhases(false)}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid #DDE2E4',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#5F6B76',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Contraer todas
              </button>
              <button
                type="button"
                onClick={() => expandAllPhases(true)}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid #DDE2E4',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#2A6F62',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Expandir todas
              </button>
              <button
                type="button"
                onClick={openPhasesManager}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid #2A6F62',
                  borderRadius: '6px',
                  background: 'rgba(42, 111, 98, 0.08)',
                  color: '#2A6F62',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⚙️</span>
                Gestionar Fases
              </button>
            </div>
          </div>

          {/* 3. SECCIÓN INFERIOR: FASES CONTRAÍDAS EN KANBAN (Alt 1 - Imagen 1) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentProject.phases.map((phase, idx) => {
              const phaseTasks = filteredTasks.filter((t) => (t.phaseIds || []).includes(phase.id));
              const doneTasks = phaseTasks.filter((t) => t.status === 'done');
              const pct = phaseTasks.length > 0 ? Math.round((doneTasks.length / phaseTasks.length) * 100) : 0;
              const isExpanded = expandedPhaseIds.has(phase.id);

              return (
                <div
                  key={phase.id}
                  id={`phase-card-${phase.id}`}
                  className={`phase-accordion-card ${isExpanded ? 'is-expanded' : ''} ${highlightedPhaseId === phase.id ? 'focus-highlight' : ''}`}
                >
                  {/* Barra de cabecera contraída */}
                  <div
                    className="phase-header-bar"
                    onClick={() => togglePhaseAccordion(phase.id)}
                    title="Haz clic para contraer o desplegar el tablero de esta fase"
                  >
                    <div className="phase-header-left">
                      <span className="phase-pill-badge">Fase {idx + 1}</span>
                      <span className="phase-header-title">{phase.name}</span>
                    </div>
                    <div className="phase-header-right">
                      <div className="phase-meta-item">
                        <span>🗓️ Meta Estimada:</span>
                        <strong>{phase.targetDate || 'Sin fecha'}</strong>
                      </div>
                      <div className="phase-meta-item">
                        <span>Progreso:</span>
                        <strong>{doneTasks.length}/{phaseTasks.length} tareas ({pct}%)</strong>
                      </div>
                      <span className="phase-chevron-icon">▼</span>
                    </div>
                  </div>

                  {/* Columnas Kanban al expandir */}
                  <div className="phase-body-content">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(230px, 1fr))', gap: '14px', alignItems: 'start', overflowX: 'auto' }}>
                      {Object.keys(columnsMeta).map((colKey) => {
                        const col = columnsMeta[colKey];
                        const colTasks = phaseTasks.filter((t) => (t.status || 'backlog') === colKey);

                        return (
                          <section
                            key={colKey}
                            aria-label={`${phase.name} - ${col.title}`}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #DDE2E4',
                              borderRadius: '8px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              minHeight: '260px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 6px 4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dot }} />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D2A33' }}>{col.title}</span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#5F6B76' }}>{colTasks.length}</span>
                            </div>

                            {colTasks.map((t) => renderTaskCardItem(t, phase.id))}

                            {colTasks.length === 0 && (
                              <div style={{ padding: '24px 8px', textAlign: 'center', color: '#8FA0AC', fontSize: '12px' }}>
                                Sin tareas
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenNewTask && onOpenNewTask({ projectId: currentProject.id, phaseIds: [phase.id], status: colKey })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '32px',
                                padding: '0 6px',
                                border: 0,
                                borderRadius: '6px',
                                background: 'transparent',
                                color: '#5F6B76',
                                font: 'inherit',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                textAlign: 'left',
                                marginTop: 'auto'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
            })}
          </div>
        </div>
      ) : (
        /* VISTA KANBAN TRADICIONAL UNIFICADA (Para proyectos continuos / existentes) */
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
                  {cards.map((c) => renderTaskCardItem(c, null))}

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
      )}

      {/* MODAL: GESTIÓN DE FASES DEL PROYECTO */}
      {isPhasesDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 52, 70, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px'
          }}

        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '740px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 32px rgba(15, 52, 70, 0.25)',
              border: '1px solid #DDE2E4'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DDE2E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1D2A33' }}>
                  Gestionar Fases del Proyecto
                </h3>
                <span style={{ fontSize: '12px', color: '#5F6B76' }}>
                  {currentProject?.name}
                </span>
              </div>
              <button
                type="button"
      
                title="Cerrar modal"
                style={{ background: 'transparent', border: 0, fontSize: '18px', cursor: 'pointer', color: '#5F6B76', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Lista de Fases en Edición */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: '#5F6B76' }}>
                Configura los nombres, fechas de inicio y metas estimadas para cada fase. El cronograma Gantt calculará los plazos y la distribución exacta de las barras según estas fechas:
              </p>

              {editingPhases.map((phase, idx) => {
                const durText = formatDurationDays(phase.startDate, phase.targetDate);
                const isOverturned = phase.startDate && phase.targetDate && phase.targetDate < phase.startDate;

                return (
                  <div
                    key={phase.id || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1.4fr) 130px 130px 95px 36px',
                      gap: '10px',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E6EBED'
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#5F6B76', display: 'block', marginBottom: '4px' }}>
                        Fase {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => handleUpdatePhaseInManager(idx, 'name', e.target.value)}
                        placeholder="Nombre de la fase"
                        style={{
                          width: '100%',
                          height: '34px',
                          border: '1px solid #DDE2E4',
                          borderRadius: '6px',
                          padding: '0 10px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#5F6B76', display: 'block', marginBottom: '4px' }}>
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={phase.startDate || ''}
                        onChange={(e) => handleUpdatePhaseInManager(idx, 'startDate', e.target.value)}
                        style={{
                          width: '100%',
                          height: '34px',
                          border: '1px solid #DDE2E4',
                          borderRadius: '6px',
                          padding: '0 8px',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#5F6B76', display: 'block', marginBottom: '4px' }}>
                        Fecha Meta / Fin
                      </label>
                      <input
                        type="date"
                        value={phase.targetDate || ''}
                        onChange={(e) => handleUpdatePhaseInManager(idx, 'targetDate', e.target.value)}
                        style={{
                          width: '100%',
                          height: '34px',
                          border: '1px solid #DDE2E4',
                          borderRadius: '6px',
                          padding: '0 8px',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: isOverturned ? '#FEE2E2' : '#E6F4F1',
                          color: isOverturned ? '#DC2626' : '#2A6F62'
                        }}
                        title={isOverturned ? 'La fecha meta es anterior a la fecha de inicio' : `Duración calculada: ${durText}`}
                      >
                        {isOverturned ? '⚠️ Inválida' : (durText || '—')}
                      </span>
                    </div>
                    <div style={{ paddingTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => handleRemovePhaseInManager(idx)}
                        title="Eliminar fase"
                        style={{
                          width: '32px',
                          height: '34px',
                          border: '1px solid #E1E5E6',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#9B3B32',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddPhaseInManager}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                  background: 'transparent',
                  border: '1px dashed #2A6F62',
                  color: '#2A6F62',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Agregar otra fase
              </button>
            </div>

            {/* Pie del Modal */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #DDE2E4', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAFBFC' }}>
              <button
                type="button"
      
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid #DDE2E4',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#5F6B76',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhasesManager}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  border: 0,
                  borderRadius: '6px',
                  background: '#2A6F62',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
