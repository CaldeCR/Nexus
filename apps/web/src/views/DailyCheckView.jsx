import React, { useState, useMemo } from 'react';
import { NavIcons } from '../components/layout/NavIcons';
import { AvatarGroup, StatusDot } from '../components/ui';

// Icono Zap vectorial local
const ZapIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ClockHistoryIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);

const CalendarCheckIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

// Formateador de fecha/hora en español
function formatLogTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }
  return dateStr;
}

// Verifica si un log corresponde al día de hoy
function isLogFromToday(log, todayStr) {
  if (!log || !log.createdAt) return false;
  if (typeof log.createdAt === 'string' && log.createdAt.startsWith(todayStr)) return true;
  const d = new Date(log.createdAt);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` === todayStr;
}

// Calcula la frescura del avance de una tarea
function getTaskFreshnessInfo(task, todayStr) {
  if (!task) return { status: 'none', days: 0, label: '', isStale: false, hasLogToday: false, todayLogs: [], latestLog: null };
  if (task.status === 'done') {
    return { status: 'done', days: 0, label: 'Completada', isStale: false, hasLogToday: false, todayLogs: [], latestLog: null };
  }

  const logs = Array.isArray(task.progressLogs) ? task.progressLogs.filter((l) => l && l.createdAt) : [];
  const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const todayLogs = sortedLogs.filter((l) => isLogFromToday(l, todayStr));
  const hasLogToday = todayLogs.length > 0;
  const latestLog = sortedLogs[0] || null;

  let latestDate = null;
  if (latestLog) {
    const d = new Date(latestLog.createdAt);
    if (!isNaN(d.getTime())) latestDate = d;
  }
  if (!latestDate && task.createdAt) {
    const d = new Date(task.createdAt);
    if (!isNaN(d.getTime())) latestDate = d;
  }

  if (hasLogToday) {
    return {
      status: 'fresh',
      days: 0,
      label: 'Al día (Seguimiento hoy)',
      isStale: false,
      hasLogToday: true,
      todayLogs,
      latestLog
    };
  }

  if (!latestDate) {
    return {
      status: 'stale',
      days: 3,
      label: '> 2 días sin reporte',
      isStale: true,
      hasLogToday: false,
      todayLogs: [],
      latestLog: null
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - latestDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return {
      status: 'attention',
      days: 0,
      label: 'Sin reporte hoy',
      isStale: false,
      hasLogToday: false,
      todayLogs: [],
      latestLog
    };
  } else if (diffDays === 1) {
    return {
      status: 'attention',
      days: 1,
      label: '1 día sin reporte',
      isStale: false,
      hasLogToday: false,
      todayLogs: [],
      latestLog
    };
  } else {
    return {
      status: 'stale',
      days: diffDays,
      label: `${diffDays} días sin reporte`,
      isStale: true,
      hasLogToday: false,
      todayLogs: [],
      latestLog
    };
  }
}

function getTaskAssigneesList(item) {
  if (!item) return [];
  if (Array.isArray(item.assignees) && item.assignees.length > 0) {
    return item.assignees.map((s) => String(s).trim()).filter(Boolean);
  }
  if (item.assignee && typeof item.assignee === 'string') {
    return item.assignee.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function DailyCheckView({
  workItems = [],
  projects = [],
  currentUser = null,
  todayStr = '',
  onSubmitProgress,
  onUpdateWorkItem,
  onEditTask,
  onOpenNewTask,
  onOpenDailyWizard,
  onNavigate
}) {
  // Pestañas principales: 'pending' (Hacen falta hoy) | 'today' (Con seguimiento hoy) | 'all' (Todas las activas)
  const [activeTab, setActiveTab] = useState('pending');
  const [projectFilter, setProjectFilter] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'code' | 'date' | 'project'

  // Estado de inputs para seguimiento rápido por tarea
  const [quickNotes, setQuickNotes] = useState({});
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [taskFeedback, setTaskFeedback] = useState({});
  const [expandedTaskInputs, setExpandedTaskInputs] = useState({});

  // Proyectos mapeados
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Clasificación de tareas en el universo del Daily Check
  // Consideramos tareas activas todas las que no están completadas ni canceladas
  const {
    allActiveTasks,
    tasksNeedingCheck,
    tasksCheckedToday,
    staleTasksCount,
    activeProjectsCount
  } = useMemo(() => {
    const active = workItems.filter((w) => w && w.status !== 'done' && w.status !== 'cancelled');
    const checkedToday = [];
    const needingCheck = [];
    let staleCount = 0;
    const activeProjIds = new Set();

    active.forEach((t) => {
      if (t.projectId) activeProjIds.add(t.projectId);
      const info = getTaskFreshnessInfo(t, todayStr);
      if (info.hasLogToday) {
        checkedToday.push(t);
      } else {
        needingCheck.push(t);
        if (info.isStale) staleCount++;
      }
    });

    // También verificamos si alguna tarea completada hoy tuvo seguimiento hoy para mostrar en bitácora
    const doneToday = workItems.filter((w) => {
      if (!w || w.status !== 'done') return false;
      return (
        (w.completedAt && w.completedAt.startsWith(todayStr)) ||
        (Array.isArray(w.progressLogs) && w.progressLogs.some((l) => isLogFromToday(l, todayStr)))
      );
    });
    doneToday.forEach((t) => {
      if (!checkedToday.some((c) => c.id === t.id)) {
        checkedToday.push(t);
      }
    });

    return {
      allActiveTasks: active,
      tasksNeedingCheck: needingCheck,
      tasksCheckedToday: checkedToday,
      staleTasksCount: staleCount,
      activeProjectsCount: activeProjIds.size
    };
  }, [workItems, todayStr]);

  // Cobertura del día (%)
  const coveragePercent = useMemo(() => {
    if (allActiveTasks.length === 0) return 100;
    const covered = allActiveTasks.filter((t) => getTaskFreshnessInfo(t, todayStr).hasLogToday).length;
    return Math.min(100, Math.round((covered / allActiveTasks.length) * 100));
  }, [allActiveTasks, todayStr]);

  // Lista base según pestaña activa
  const baseList = useMemo(() => {
    if (activeTab === 'pending') return tasksNeedingCheck;
    if (activeTab === 'today') return tasksCheckedToday;
    return allActiveTasks;
  }, [activeTab, tasksNeedingCheck, tasksCheckedToday, allActiveTasks]);

  // Filtrado y ordenamiento de tareas
  const displayedTasks = useMemo(() => {
    let result = baseList;

    // Filtro por proyecto
    if (projectFilter !== 'all') {
      result = result.filter((t) => t.projectId === projectFilter);
    }

    // Filtro "Solo mis tareas"
    if (onlyMine && currentUser) {
      const currentName = (currentUser.name || '').toLowerCase();
      result = result.filter((t) => {
        const assignees = getTaskAssigneesList(t);
        return assignees.some(
          (a) =>
            a.toLowerCase().includes('jorge') ||
            (currentName && a.toLowerCase().includes(currentName))
        );
      });
    }

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const codeMatch = (t.code || '').toLowerCase().includes(q);
        const assignees = getTaskAssigneesList(t).join(' ').toLowerCase();
        const assigneeMatch = assignees.includes(q);
        const projName = projectMap[t.projectId]?.name?.toLowerCase() || '';
        const projMatch = projName.includes(q);
        return titleMatch || codeMatch || assigneeMatch || projMatch;
      });
    }

    // Ordenamiento
    const sorted = [...result].sort((a, b) => {
      if (sortBy === 'urgency') {
        const infoA = getTaskFreshnessInfo(a, todayStr);
        const infoB = getTaskFreshnessInfo(b, todayStr);
        if (infoA.isStale && !infoB.isStale) return -1;
        if (!infoA.isStale && infoB.isStale) return 1;
        return (infoB.days || 0) - (infoA.days || 0);
      }
      if (sortBy === 'code') {
        return (a.code || '').localeCompare(b.code || '');
      }
      if (sortBy === 'date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'project') {
        const nameA = projectMap[a.projectId]?.name || '';
        const nameB = projectMap[b.projectId]?.name || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return sorted;
  }, [baseList, projectFilter, onlyMine, currentUser, searchQuery, sortBy, projectMap, todayStr]);

  // Manejar registro rápido de avance inline
  const handleSaveQuickProgress = async (task, isNoChange = false) => {
    if (!task || !onSubmitProgress) return;
    const defaultText = 'Continúa en curso según lo planificado.';
    const noteText = isNoChange
      ? defaultText
      : (quickNotes[task.id] || '').trim();

    if (!noteText) return;

    setSubmittingTaskId(task.id);
    try {
      await onSubmitProgress(task.id, noteText);
      setQuickNotes((prev) => ({ ...prev, [task.id]: '' }));
      setTaskFeedback((prev) => ({
        ...prev,
        [task.id]: { type: 'success', text: '✓ Avance registrado exitosamente' }
      }));
      // Limpiar feedback después de 4s
      setTimeout(() => {
        setTaskFeedback((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }, 4000);
    } catch (err) {
      setTaskFeedback((prev) => ({
        ...prev,
        [task.id]: { type: 'error', text: err.message || 'Error al guardar avance' }
      }));
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // Ejecutar el Daily Check-in guiado (uno por uno)
  const handleRunGuidedWizard = () => {
    if (!onOpenDailyWizard) return;
    // Si hay pendientes, pasamos las pendientes filtradas o todas las pendientes
    if (tasksNeedingCheck.length > 0) {
      onOpenDailyWizard(tasksNeedingCheck);
    } else {
      // Si ya todas tienen seguimiento, permitimos revisar todas las activas
      onOpenDailyWizard(allActiveTasks);
    }
  };

  return (
    <div className="daily-check-view" role="main" aria-label="Daily Check-in y Bitácora">
      {/* 1. CABECERA PRINCIPAL */}
      <div className="dc-header">
        <div className="dc-header-left">
          <div className="dc-title-group">
            <span className="dc-title-icon">
              <NavIcons.DailyCheck size={24} />
            </span>
            <div>
              <h1 className="dc-title">Daily Check-in & Bitácora de Seguimiento</h1>
              <p className="dc-subtitle">
                Supervisión continua de tareas, cadencia diaria de avance y bitácora de seguimiento por proyecto.
              </p>
            </div>
          </div>
        </div>

        <div className="dc-header-actions">
          {/* BOTÓN HERO: EJECUTAR DAILY CHECK-IN GUIADO */}
          <button
            type="button"
            className="ui-btn ui-btn--primary dc-btn-run-wizard"
            onClick={handleRunGuidedWizard}
            title="Iniciar revisión interactiva de tareas pendientes una por una"
          >
            <ZapIcon size={18} />
            <span>Ejecutar Daily Check-in Guiado</span>
            {tasksNeedingCheck.length > 0 ? (
              <span className="dc-wizard-counter-badge">{tasksNeedingCheck.length}</span>
            ) : (
              <span className="dc-wizard-counter-badge success">✓</span>
            )}
          </button>

          {onOpenNewTask && (
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={() => onOpenNewTask()}
              title="Crear una nueva tarea en un proyecto"
            >
              <NavIcons.Plus size={16} />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS / KPIS */}
      <div className="dc-kpi-grid">
        {/* KPI 1: Pendientes de seguimiento hoy */}
        <div
          className={`dc-kpi-card ${tasksNeedingCheck.length > 0 ? 'is-warning' : 'is-success'}`}
          onClick={() => setActiveTab('pending')}
          style={{ cursor: 'pointer' }}
          title="Ver tareas que hacen falta de dar seguimiento hoy"
        >
          <div className="dc-kpi-top">
            <span className="dc-kpi-label">Hacen Falta Hoy</span>
            <span className={`dc-kpi-icon-pill ${tasksNeedingCheck.length > 0 ? 'warning' : 'success'}`}>
              <NavIcons.ClockAlert size={18} />
            </span>
          </div>
          <div className="dc-kpi-value">{tasksNeedingCheck.length}</div>
          <div className="dc-kpi-footer">
            {staleTasksCount > 0 ? (
              <span className="dc-kpi-alert-text">
                ⚠️ {staleTasksCount} {staleTasksCount === 1 ? 'tarea con >48h' : 'tareas con >48h'} sin reporte
              </span>
            ) : tasksNeedingCheck.length > 0 ? (
              <span>Requieren actualización de avance hoy</span>
            ) : (
              <span className="dc-kpi-success-text">🎉 ¡Todas las tareas al día!</span>
            )}
          </div>
        </div>

        {/* KPI 2: Con seguimiento hoy */}
        <div
          className="dc-kpi-card is-success"
          onClick={() => setActiveTab('today')}
          style={{ cursor: 'pointer' }}
          title="Ver bitácora de tareas a las que ya se les dio seguimiento hoy"
        >
          <div className="dc-kpi-top">
            <span className="dc-kpi-label">Con Seguimiento Hoy</span>
            <span className="dc-kpi-icon-pill success">
              <CalendarCheckIcon size={18} />
            </span>
          </div>
          <div className="dc-kpi-value">{tasksCheckedToday.length}</div>
          <div className="dc-kpi-footer">
            <span>Bitácora activa con reportes de hoy</span>
          </div>
        </div>

        {/* KPI 3: Total Tareas Activas */}
        <div
          className="dc-kpi-card is-neutral"
          onClick={() => setActiveTab('all')}
          style={{ cursor: 'pointer' }}
          title="Ver todas las tareas activas participantes"
        >
          <div className="dc-kpi-top">
            <span className="dc-kpi-label">Total Activas</span>
            <span className="dc-kpi-icon-pill neutral">
              <NavIcons.SquareCheck size={18} />
            </span>
          </div>
          <div className="dc-kpi-value">{allActiveTasks.length}</div>
          <div className="dc-kpi-footer">
            <span>En {activeProjectsCount} {activeProjectsCount === 1 ? 'proyecto activo' : 'proyectos activos'}</span>
          </div>
        </div>

        {/* KPI 4: Cobertura del día */}
        <div className="dc-kpi-card is-progress">
          <div className="dc-kpi-top">
            <span className="dc-kpi-label">Cobertura de Hoy</span>
            <span className="dc-kpi-percent-badge">{coveragePercent}%</span>
          </div>
          <div className="dc-kpi-progress-bar">
            <div
              className="dc-kpi-progress-fill"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <div className="dc-kpi-footer">
            <span>{tasksCheckedToday.length} de {allActiveTasks.length} tareas revisadas hoy</span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE PESTAÑAS Y CONTROLES DE FILTRO */}
      <div className="dc-controls-bar">
        {/* Pestañas Segmentadas */}
        <div className="dc-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pending'}
            className={`dc-tab-btn ${activeTab === 'pending' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span>⏳ Hacen Falta de Seguimiento</span>
            <span className={`dc-tab-count ${tasksNeedingCheck.length > 0 ? 'badge-danger' : 'badge-neutral'}`}>
              {tasksNeedingCheck.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'today'}
            className={`dc-tab-btn ${activeTab === 'today' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <span>✓ Con Seguimiento Hoy (Bitácora)</span>
            <span className="dc-tab-count badge-success">
              {tasksCheckedToday.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`dc-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>📋 Todas las Activas</span>
            <span className="dc-tab-count badge-neutral">
              {allActiveTasks.length}
            </span>
          </button>
        </div>

        {/* Filtros secundarios */}
        <div className="dc-filters-group">
          {/* Búsqueda */}
          <div className="dc-search-box">
            <NavIcons.Search size={15} />
            <input
              type="text"
              placeholder="Buscar por tarea, código, responsable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dc-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="dc-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Proyecto */}
          <select
            className="dc-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filtrar por proyecto"
          >
            <option value="all">Todos los proyectos ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `[${p.code}] ` : ''}{p.name}
              </option>
            ))}
          </select>

          {/* Toggle Solo Mis Tareas */}
          <button
            type="button"
            className={`dc-filter-pill-btn ${onlyMine ? 'is-active' : ''}`}
            onClick={() => setOnlyMine(!onlyMine)}
            title="Mostrar únicamente tareas asignadas a mí"
          >
            <NavIcons.Users size={14} />
            <span>Mis Tareas</span>
          </button>

          {/* Selector de Orden */}
          <select
            className="dc-select dc-select--compact"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar tareas"
          >
            <option value="urgency">Ordenar: Urgencia / Antigüedad</option>
            <option value="date">Ordenar: Fecha límite</option>
            <option value="project">Ordenar: Por Proyecto</option>
            <option value="code">Ordenar: Código de tarea</option>
          </select>
        </div>
      </div>

      {/* 4. LISTA DE TAREAS / BITÁCORA */}
      <div className="dc-list-container">
        {displayedTasks.length === 0 ? (
          <div className="dc-empty-state">
            {activeTab === 'pending' ? (
              <div className="dc-empty-box">
                <span className="dc-empty-icon">🎉</span>
                <h3 className="dc-empty-title">¡Excelente! No hay tareas pendientes de seguimiento</h3>
                <p className="dc-empty-desc">
                  Todas las tareas activas ya cuentan con avances o seguimiento registrado el día de hoy.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary ui-btn--small"
                    onClick={() => setActiveTab('today')}
                  >
                    Ver Bitácora de Hoy ({tasksCheckedToday.length})
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={() => setActiveTab('all')}
                  >
                    Ver Todas las Tareas
                  </button>
                </div>
              </div>
            ) : activeTab === 'today' ? (
              <div className="dc-empty-box">
                <span className="dc-empty-icon">☕</span>
                <h3 className="dc-empty-title">Sin seguimiento registrado el día de hoy</h3>
                <p className="dc-empty-desc">
                  Aún no se han registrado notas de seguimiento hoy. Puedes registrar avances directamente en las tareas pendientes o usar el Daily Check-in guiado.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary ui-btn--small"
                    onClick={() => setActiveTab('pending')}
                  >
                    Ir a Tareas Pendientes ({tasksNeedingCheck.length})
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={handleRunGuidedWizard}
                  >
                    Iniciar Daily Check-in Guiado
                  </button>
                </div>
              </div>
            ) : (
              <div className="dc-empty-box">
                <span className="dc-empty-icon">🔍</span>
                <h3 className="dc-empty-title">No se encontraron tareas</h3>
                <p className="dc-empty-desc">
                  Ninguna tarea coincide con los filtros de búsqueda o proyecto seleccionados.
                </p>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary ui-btn--small"
                  onClick={() => {
                    setSearchQuery('');
                    setProjectFilter('all');
                    setOnlyMine(false);
                  }}
                  style={{ marginTop: '10px' }}
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="dc-cards-flow">
            {displayedTasks.map((task) => {
              const freshness = getTaskFreshnessInfo(task, todayStr);
              const proj = projectMap[task.projectId];
              const assignees = getTaskAssigneesList(task);
              const isLate = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
              const feedback = taskFeedback[task.id];
              const isSubmitting = submittingTaskId === task.id;
              const hasLogsToday = freshness.hasLogToday;
              const isInputExpanded = expandedTaskInputs[task.id] || !hasLogsToday;

              return (
                <article
                  key={task.id}
                  className={`dc-task-card ${hasLogsToday ? 'is-checked-today' : freshness.isStale ? 'is-stale-card' : ''}`}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div className="dc-card-header">
                    <div className="dc-card-header-left">
                      {/* Código de Proyecto / Nombre */}
                      <span className="dc-project-badge" title={proj?.name || 'Proyecto general'}>
                        {proj?.code ? `[${proj.code}] ` : ''}{proj?.name || 'General'}
                      </span>

                      {/* Código de la Tarea */}
                      {task.code && (
                        <span className="dc-task-code-badge">{task.code}</span>
                      )}

                      {/* Prioridad */}
                      {task.priority === 'high' && (
                        <span className="dc-priority-pill high">↑ Alta</span>
                      )}
                      {task.priority === 'medium' && (
                        <span className="dc-priority-pill medium">Media</span>
                      )}
                      {task.priority === 'low' && (
                        <span className="dc-priority-pill low">Baja</span>
                      )}

                      {/* Estado */}
                      <span className="dc-status-pill">
                        <StatusDot status={task.status || 'backlog'} />
                        <span style={{ textTransform: 'capitalize' }}>
                          {task.status === 'in_progress'
                            ? 'En curso'
                            : task.status === 'review'
                            ? 'En revisión'
                            : task.status === 'done'
                            ? 'Completada'
                            : 'Por hacer'}
                        </span>
                      </span>
                    </div>

                    <div className="dc-card-header-right">
                      {/* Badge de Frescura / Estatus Diario */}
                      {hasLogsToday ? (
                        <span className="dc-freshness-pill fresh" title="Ya se registró avance hoy">
                          <NavIcons.Check size={14} />
                          <span>Seguimiento registrado hoy</span>
                        </span>
                      ) : freshness.isStale ? (
                        <span className="dc-freshness-pill stale" title={`${freshness.days} días sin registrar avance`}>
                          <NavIcons.Alert size={14} />
                          <span>{freshness.label}</span>
                        </span>
                      ) : (
                        <span className="dc-freshness-pill attention" title="Pendiente de reporte hoy">
                          <ClockHistoryIcon size={14} />
                          <span>Pendiente de seguimiento</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo: Título y Metadatos */}
                  <div className="dc-card-body">
                    <h3
                      className="dc-card-title"
                      onClick={() => onEditTask && onEditTask(task)}
                      title="Clic para editar o ver detalles completos de la tarea"
                    >
                      {task.title}
                    </h3>

                    <div className="dc-card-meta-row">
                      {/* Responsables */}
                      <div className="dc-meta-item">
                        <span className="dc-meta-label">Responsable:</span>
                        {assignees.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AvatarGroup names={assignees} size={22} />
                            <span className="dc-meta-value">{assignees.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="dc-meta-value text-muted">Sin asignar</span>
                        )}
                      </div>

                      {/* Fecha Límite */}
                      {task.dueDate && (
                        <div className="dc-meta-item">
                          <span className="dc-meta-label">Fecha límite:</span>
                          <span className={`dc-date-pill ${isLate ? 'is-late' : ''}`}>
                            {isLate ? `⚠️ Vencida: ${formatDateFriendly(task.dueDate)}` : formatDateFriendly(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN DE BITÁCORA: Historial y avances */}
                  <div className="dc-bitacora-section">
                    {/* Si tiene seguimientos registrados HOY */}
                    {hasLogsToday ? (
                      <div className="dc-today-logs-box">
                        <div className="dc-bitacora-header">
                          <span className="dc-bitacora-tag success">
                            <CalendarCheckIcon size={14} />
                            <span>Bitácora de Hoy ({freshness.todayLogs.length})</span>
                          </span>
                        </div>

                        <div className="dc-today-logs-list">
                          {freshness.todayLogs.map((log, idx) => (
                            <div key={log.id || idx} className="dc-today-log-entry">
                              <div className="dc-log-top">
                                <strong className="dc-log-author">{log.author || 'Equipo'}</strong>
                                <span className="dc-log-time">{formatLogTime(log.createdAt)}</span>
                              </div>
                              <p className="dc-log-text">"{log.text}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : freshness.latestLog ? (
                      /* Si NO tiene reporte hoy pero tiene reporte previo */
                      <div className="dc-previous-log-box">
                        <div className="dc-bitacora-header">
                          <span className="dc-bitacora-tag neutral">
                            <ClockHistoryIcon size={13} />
                            <span>Último avance registrado</span>
                          </span>
                          <span className="dc-log-prev-date">
                            {formatDateFriendly(freshness.latestLog.createdAt)} por {freshness.latestLog.author || 'Equipo'}
                          </span>
                        </div>
                        <p className="dc-log-prev-text">
                          "{freshness.latestLog.text}"
                        </p>
                      </div>
                    ) : (
                      /* Sin avances registrados nunca */
                      <div className="dc-no-logs-box">
                        <span>ℹ️ Aún no se ha registrado ningún avance desde su creación. Registra el primer seguimiento abajo.</span>
                      </div>
                    )}
                  </div>

                  {/* FORMULARIO DE SEGUIMIENTO RÁPIDO & ACCIONES */}
                  <div className="dc-card-actions-area">
                    {feedback && (
                      <div className={`dc-feedback-banner ${feedback.type}`}>
                        {feedback.text}
                      </div>
                    )}

                    {isInputExpanded ? (
                      <div className="dc-quick-log-form">
                        <label className="dc-quick-log-label" htmlFor={`quick-input-${task.id}`}>
                          <span>¿Qué avance hubo hoy en esta tarea?</span>
                        </label>

                        <div className="dc-quick-log-input-row">
                          <input
                            id={`quick-input-${task.id}`}
                            type="text"
                            className="dc-quick-input"
                            placeholder="Escribe el avance... (ej. Se validó con Softland, se programa pase a pruebas)"
                            value={quickNotes[task.id] || ''}
                            onChange={(e) =>
                              setQuickNotes({ ...quickNotes, [task.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveQuickProgress(task, false);
                            }}
                            disabled={isSubmitting}
                          />

                          <button
                            type="button"
                            className="ui-btn ui-btn--primary ui-btn--small"
                            onClick={() => handleSaveQuickProgress(task, false)}
                            disabled={isSubmitting || !(quickNotes[task.id] || '').trim()}
                            title="Guardar este avance en la bitácora"
                          >
                            <NavIcons.Check size={14} />
                            <span>Guardar Avance</span>
                          </button>
                        </div>

                        <div className="dc-quick-buttons-row">
                          <button
                            type="button"
                            className="ui-btn ui-btn--secondary ui-btn--small dc-btn-no-change"
                            onClick={() => handleSaveQuickProgress(task, true)}
                            disabled={isSubmitting}
                            title="Registrar que la tarea sigue en curso según lo planificado"
                          >
                            <ZapIcon size={13} />
                            <span>Continúa en curso (Sin cambios)</span>
                          </button>

                          <div className="dc-action-btns-right">
                            <button
                              type="button"
                              className="ui-btn ui-btn--ghost ui-btn--small"
                              onClick={() => onEditTask && onEditTask(task)}
                              title="Abrir formulario completo para editar fechas, responsables, descripción o estado"
                            >
                              <NavIcons.Edit size={14} />
                              <span>Editar Tarea</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="dc-quick-collapsed-row">
                        <button
                          type="button"
                          className="ui-btn ui-btn--secondary ui-btn--small"
                          onClick={() =>
                            setExpandedTaskInputs({ ...expandedTaskInputs, [task.id]: true })
                          }
                        >
                          <NavIcons.Plus size={14} />
                          <span>+ Agregar otro avance hoy</span>
                        </button>

                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--small"
                          onClick={() => onEditTask && onEditTask(task)}
                          title="Abrir formulario completo para editar tarea"
                        >
                          <NavIcons.Edit size={14} />
                          <span>Editar Tarea</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
