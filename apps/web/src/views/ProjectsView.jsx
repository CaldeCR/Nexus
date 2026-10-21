import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { StatusDot } from '../components/ui/StatusDot';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AvatarGroup } from '../components/ui/Avatar';
import { KpiStrip } from '../components/ui/KpiStrip';
import { EmptyState } from '../components/ui/EmptyState';
import { Icons } from '../components/ui';
import { ProjectMeetingsTab } from '../components/meetings/ProjectMeetingsTab';

export function ProjectsView({
  projects = [],
  allProjects = [],
  currentUser = null,
  todayStr = '',
  space = 'all',
  onSpaceChange,
  selectedProjectId = null,
  onSelectProject,
  workItems = [],
  onSubmitProgress,
  onUpdateWorkItem,
  onOpenNewTask,
  onOpenNewProject,
  onEditProject,
  onOpenTeamModal,
  onOpenStatusModal,
  onDeleteProject,
  onDailyCheckProject,
  onQuickUpdateProjectStatus,
  onNavigate,
  onCreatePersonalProject,
  meetings = [],
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onCreateTaskFromAction
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'lead' | 'collaborator'
  const [stageFilter, setStageFilter] = useState('all');
  const [openMenuProjectId, setOpenMenuProjectId] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'done'
  const [activeDetailTab, setActiveDetailTab] = useState('tasks'); // 'tasks' | 'meetings'

  // Close actions menu on click outside
  React.useEffect(() => {
    const handleOutsideClick = () => setOpenMenuProjectId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Proyecto seleccionado para vista de Detalle & Control (Master-Detail)
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return (
      allProjects.find((p) => p.id === selectedProjectId) ||
      projects.find((p) => p.id === selectedProjectId) ||
      null
    );
  }, [allProjects, projects, selectedProjectId]);

  // Tareas asignadas específicamente al proyecto seleccionado
  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return workItems.filter((w) => w.projectId === selectedProject.id);
  }, [workItems, selectedProject]);

  const taskCounts = useMemo(() => {
    const pending = projectTasks.filter((t) => t.status === 'todo' || t.status === 'backlog').length;
    const inProgress = projectTasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length;
    const done = projectTasks.filter((t) => t.status === 'done').length;
    return { all: projectTasks.length, pending, inProgress, done };
  }, [projectTasks]);

  const projectMeetingsCount = useMemo(() => {
    if (!selectedProject) return 0;
    return meetings.filter(
      (m) =>
        m.projectId === selectedProject.id ||
        (selectedProject.code && (m.projectCode === selectedProject.code || m.projectId === selectedProject.code))
    ).length;
  }, [meetings, selectedProject]);

  const filteredProjectTasks = useMemo(() => {
    if (taskFilter === 'all') return projectTasks;
    if (taskFilter === 'pending') return projectTasks.filter((t) => t.status === 'todo' || t.status === 'backlog');
    if (taskFilter === 'in_progress') return projectTasks.filter((t) => t.status === 'in_progress' || t.status === 'review');
    if (taskFilter === 'done') return projectTasks.filter((t) => t.status === 'done');
    return projectTasks;
  }, [projectTasks, taskFilter]);

  const getTaskStageMeta = (status) => {
    switch (status) {
      case 'done':
        return { label: 'Hecho', bg: 'var(--nexus-green-50, #E8F5E9)', color: 'var(--nexus-green, #4C8A45)', dot: '#4C8A45' };
      case 'in_progress':
        return { label: 'En curso', bg: 'var(--nexus-teal-50, #E6F0EE)', color: 'var(--nexus-petrol, #0F3446)', dot: '#2A6F62' };
      case 'review':
        return { label: 'Validación', bg: '#FFF8E1', color: '#B98A1E', dot: '#B98A1E' };
      default:
        return { label: 'Pendiente', bg: 'var(--surface-muted, #EDF0F0)', color: 'var(--ink-600, #5F6B76)', dot: '#9AA4AC' };
    }
  };

  const handleToggleTask = (task) => {
    if (task.status === 'done') {
      if (onUpdateWorkItem) {
        onUpdateWorkItem({ ...task, status: 'todo', progressPct: 0 });
      }
    } else {
      if (onSubmitProgress) {
        onSubmitProgress(task.id, {
          status: 'done',
          progressPct: 100,
          report: 'Tarea finalizada directamente desde el Hub del Proyecto.'
        });
      } else if (onUpdateWorkItem) {
        onUpdateWorkItem({ ...task, status: 'done', progressPct: 100 });
      }
    }
  };

  // Filter projects by space, search, role, and stage
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Space filter
      if (space !== 'all') {
        const projSpace = project.space || 'work';
        if (projSpace !== space) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (project.name || '').toLowerCase().includes(term);
        const matchCode = (project.code || '').toLowerCase().includes(term);
        const matchDesc = (project.description || '').toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchDesc) return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        if (project.role !== roleFilter) return false;
      }

      // Stage filter
      if (stageFilter !== 'all') {
        if (project.status !== stageFilter) return false;
      }

      return true;
    });
  }, [projects, space, searchTerm, roleFilter, stageFilter]);

  // Global KPIs calculation (§6.7)
  const kpis = useMemo(() => {
    const list = filteredProjects;
    const activeProjects = list.filter((p) => p.status !== 'completed' && p.status !== 'discarded');
    const totalOpenTasks = list.reduce((acc, p) => acc + ((p.totalTasks || 0) - (p.doneTasks || 0)), 0);
    const overdueProjects = list.filter((p) => p.isOverdue).length;

    const totalTasksAll = list.reduce((acc, p) => acc + (p.totalTasks || 0), 0);
    const doneTasksAll = list.reduce((acc, p) => acc + (p.doneTasks || 0), 0);
    const avgProgress = totalTasksAll > 0 ? Math.round((doneTasksAll / totalTasksAll) * 100) : 0;

    return {
      activeCount: activeProjects.length,
      openTasks: totalOpenTasks,
      overdueCount: overdueProjects,
      avgProgress
    };
  }, [filteredProjects]);

  const leadCount = useMemo(() => projects.filter((p) => p.role === 'lead').length, [projects]);
  const collabCount = useMemo(() => projects.filter((p) => p.role === 'collaborator').length, [projects]);

  const getTeamNames = (project) => {
    if (project.teamMembers && project.teamMembers.length > 0) {
      return project.teamMembers.map((m) => m.name);
    }
    const combined = [...(project.admins || []), ...(project.members || [])];
    return combined.length > 0 ? combined : [currentUser?.name || 'Jorge'];
  };

  const getSpaceLabel = (project) => {
    const sp = (project.space === 'personal' ? 'Personal' : 'Trabajo · Empresa');
    const templateName = {
      kanban: 'Kanban',
      scrum: 'Scrum',
      pmi: 'PMI',
      custom: 'Personalizada'
    }[project.template] || 'Kanban';

    return `${sp} · ${templateName}`;
  };

  const calculateDaysOverdue = (targetDate) => {
    if (!targetDate || !todayStr) return 0;
    const target = new Date(targetDate).getTime();
    const today = new Date(todayStr).getTime();
    if (today > target) {
      const diffDays = Math.ceil((today - target) / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const tones = ['#2A6F62', '#4A6B7A', '#0F3446', '#5C6670', '#7A5C3E', '#4C8A45', '#B98A1E'];
  const statusMeta = {
    review: { label: 'En revisión', dot: '#B98A1E' },
    execution: { label: 'En ejecución', dot: '#2A6F62' },
    preproject: { label: 'Preproyecto', dot: '#9AA4AC' },
    completed: { label: 'Finalizado', dot: '#4C8A45' },
    discarded: { label: 'Descartado', dot: '#9AA4AC' }
  };

  /* ========================================================================= */
  /* PROTOTIPO: HUB DE DETALLE & CONTROL DEL PROYECTO SELECCIONADO              */
  /* ========================================================================= */
  if (selectedProject) {
    const toneIdx = allProjects.findIndex((p) => p.id === selectedProject.id);
    const tone = tones[(toneIdx >= 0 ? toneIdx : 0) % tones.length];
    const daysOverdue = calculateDaysOverdue(selectedProject.targetDate);
    const teamMembers = getTeamNames(selectedProject);
    const pct = selectedProject.progressPct !== undefined
      ? selectedProject.progressPct
      : (projectTasks.length > 0 ? Math.round((taskCounts.done / projectTasks.length) * 100) : 0);

    const overdueTasks = projectTasks.filter((t) => {
      if (t.status === 'done') return false;
      const due = t.dueDate || t.targetDate;
      return due && todayStr && due < todayStr;
    });

    const daysRemaining = selectedProject.targetDate && todayStr
      ? Math.round((new Date(selectedProject.targetDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div className="project-detail-container" style={{ padding: bp === 'tablet' ? '24px 28px' : (isMobile ? '16px 16px 88px 16px' : undefined) }}>
        {/* 1. Barra Superior con Botón de Regreso y Acciones de Control */}
        <div className="project-detail-topbar">
          <button
            type="button"
            className="project-detail-back-btn"
            onClick={() => onSelectProject(null)}
            title="Volver a la vista comparativa de todos los proyectos"
          >
            <Icons.ChevronLeft size={16} />
            <span>Volver a Todos los proyectos</span>
          </button>

          <div className="project-detail-top-actions">
            {/* Selector Rápido de Estado */}
            <div className="project-status-quick-picker" title="Cambiar estado del proyecto">
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: statusMeta[selectedProject.status]?.dot || '#2A6F62',
                  flexShrink: 0
                }}
              />
              <select
                className="project-status-quick-select"
                value={selectedProject.status || 'execution'}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (onQuickUpdateProjectStatus) {
                    onQuickUpdateProjectStatus(selectedProject.id, newStatus);
                  } else if (onEditProject) {
                    onEditProject({ ...selectedProject, status: newStatus });
                  }
                }}
                aria-label="Estado del proyecto"
              >
                <option value="preproject">Preproyecto</option>
                <option value="execution">En ejecución</option>
                <option value="review">En revisión</option>
                <option value="completed">Finalizado</option>
                <option value="discarded">Descartado</option>
              </select>
            </div>

            {/* Estatus y Resumen */}
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--small"
              onClick={() => onOpenStatusModal(selectedProject)}
              title="Generar y copiar reporte ejecutivo de estatus"
            >
              <Icons.FileText size={15} />
              <span>Estatus & Resumen</span>
            </button>

            {/* Daily Check */}
            <button
              type="button"
              className={`ui-btn ui-btn--secondary ui-btn--small ${selectedProject.staleTasksCount > 0 ? 'is-pending' : ''}`}
              onClick={() => onDailyCheckProject(selectedProject)}
              title="Revisar Daily Check de este proyecto"
            >
              <Icons.DailyCheck size={15} />
              <span>Daily Check</span>
              {selectedProject.staleTasksCount > 0 && (
                <span className="top-daily-checkin-badge danger" style={{ marginLeft: 4 }}>
                  {selectedProject.staleTasksCount}
                </span>
              )}
            </button>

            {/* Editar Información */}
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--small"
              onClick={() => onEditProject(selectedProject)}
              title="Editar información del proyecto"
            >
              <Icons.Edit size={15} />
              <span>Editar</span>
            </button>

            {/* Gestionar Equipo */}
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--small"
              onClick={() => onOpenTeamModal(selectedProject)}
              title="Gestionar miembros asignados"
            >
              <Icons.UsersGear size={15} />
              <span>Equipo</span>
            </button>

            {/* Eliminar */}
            <button
              type="button"
              className="ui-btn ui-btn--danger ui-btn--small"
              onClick={() => onDeleteProject(selectedProject)}
              title="Eliminar proyecto"
              aria-label="Eliminar proyecto"
            >
              <Icons.Trash size={15} />
            </button>
          </div>
        </div>

        {/* 2. Cabecera Hero del Proyecto */}
        <div className="project-detail-header-card">
          <div className="project-detail-hero-row">
            <div className="project-detail-hero-left">
              <span
                className="project-detail-code-badge"
                style={{ background: tone }}
              >
                {selectedProject.code || 'P'}
              </span>
              <div className="project-detail-title-col">
                <h1 className="project-detail-title">{selectedProject.name}</h1>
                <div className="project-detail-meta-pills">
                  <span className="project-meta-pill is-primary">
                    {getSpaceLabel(selectedProject)}
                  </span>
                  <span className="project-meta-pill">
                    {selectedProject.role === 'lead' ? 'Soy encargado' : 'Colaborador'}
                  </span>
                  <span className="project-meta-pill">
                    {selectedProject.targetDate ? `Meta: ${selectedProject.targetDate}` : 'Sin fecha límite'}
                  </span>
                  {selectedProject.isOverdue ? (
                    <span className="project-meta-pill" style={{ background: '#FDE8E8', color: '#9B3B32', fontWeight: 600 }}>
                      ⚠️ {daysOverdue > 0 ? `${daysOverdue}d de atraso` : 'Atrasado'}
                    </span>
                  ) : (
                    <span className="project-meta-pill" style={{ background: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}>
                      ✓ En fecha
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Accesos directos a Tablero y Cronograma */}
            <div className="project-detail-hero-shortcuts">
              <button
                type="button"
                className="ui-btn ui-btn--secondary ui-btn--small"
                onClick={() => onNavigate && onNavigate('kanban')}
                title="Abrir este proyecto en el Tablero Kanban"
              >
                <Icons.Board size={15} />
                <span>Tablero Kanban →</span>
              </button>
              <button
                type="button"
                className="ui-btn ui-btn--secondary ui-btn--small"
                onClick={() => onNavigate && onNavigate('timeline')}
                title="Abrir este proyecto en el Cronograma Gantt"
              >
                <Icons.Timeline size={15} />
                <span>Cronograma Gantt →</span>
              </button>
            </div>
          </div>

          {/* Descripción & Objetivos */}
          {selectedProject.description ? (
            <div className="project-detail-desc-box">
              <strong>Descripción y Objetivos</strong>
              <p style={{ margin: 0 }}>{selectedProject.description}</p>
            </div>
          ) : (
            <div className="project-detail-desc-box" style={{ fontStyle: 'italic', color: 'var(--ink-500)' }}>
              Sin descripción registrada para este proyecto. Puedes agregarla en <strong>"Editar"</strong>.
            </div>
          )}
        </div>

        {/* 3. Barra de Avance del Proyecto & Alerta Informativa Inteligente */}
        <div className="project-detail-progress-card">
          <div className="project-progress-card-top">
            <div className="project-progress-info-left">
              <div className="project-progress-title-row">
                <span className="project-progress-label">Avance del Proyecto</span>
                <strong className="project-progress-pct-badge">{pct}%</strong>
              </div>
              <span className="project-progress-sublabel">
                {taskCounts.done} de {projectTasks.length} {projectTasks.length === 1 ? 'tarea completada' : 'tareas completadas'}
              </span>
            </div>

            <div className="project-progress-breakdown">
              <span className="project-progress-pill is-done" title="Tareas completadas">
                <span className="project-pill-dot" />
                <strong>{taskCounts.done}</strong> Hechas
              </span>
              <span className="project-progress-pill is-in-progress" title="Tareas en curso">
                <span className="project-pill-dot" />
                <strong>{taskCounts.inProgress}</strong> En curso
              </span>
              <span className="project-progress-pill is-pending" title="Tareas pendientes">
                <span className="project-pill-dot" />
                <strong>{taskCounts.pending}</strong> Pendientes
              </span>
            </div>
          </div>

          {/* Barra de Progreso del Proyecto */}
          <div className="project-progress-track" title={`Avance del proyecto: ${pct}%`}>
            <div
              className="project-progress-fill is-done"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Alerta Informativa Inteligente y Conveniente */}
          {selectedProject.isOverdue || overdueTasks.length > 0 ? (
            <div className="project-detail-alert-box is-critical">
              <span className="project-alert-icon">⚠️</span>
              <div className="project-alert-content">
                <strong>Atención de Cronograma:</strong>
                <span>
                  {selectedProject.isOverdue && daysOverdue > 0
                    ? `La fecha meta del proyecto venció hace ${daysOverdue} día(s). `
                    : ''}
                  {overdueTasks.length > 0
                    ? `Hay ${overdueTasks.length} ${overdueTasks.length === 1 ? 'tarea con fecha límite vencida' : 'tareas con fecha límite vencida'} que requieren regularización.`
                    : 'Revisa las tareas para reencauzar la entrega en fecha.'}
                </span>
              </div>
              {overdueTasks.length > 0 && (
                <button
                  type="button"
                  className="project-alert-action-btn"
                  onClick={() => setTaskFilter(taskFilter === 'pending' ? 'all' : 'pending')}
                >
                  {taskFilter === 'pending' ? 'Ver todas' : 'Ver pendientes'}
                </button>
              )}
            </div>
          ) : selectedProject.staleTasksCount > 0 ? (
            <div className="project-detail-alert-box is-warning">
              <span className="project-alert-icon">🕒</span>
              <div className="project-alert-content">
                <strong>Seguimiento Requerido:</strong>
                <span>
                  {selectedProject.staleTasksCount} {selectedProject.staleTasksCount === 1 ? 'tarea no ha registrado avances' : 'tareas no han registrado avances'} en los últimos días.
                </span>
              </div>
              <button
                type="button"
                className="project-alert-action-btn"
                onClick={() => onDailyCheckProject && onDailyCheckProject(selectedProject)}
              >
                Hacer Daily Check
              </button>
            </div>
          ) : projectTasks.length === 0 ? (
            <div className="project-detail-alert-box is-info">
              <span className="project-alert-icon">💡</span>
              <div className="project-alert-content">
                <strong>Proyecto en Planificación:</strong>
                <span>Aún no tienes tareas asignadas a este proyecto. Añade la primera tarea para comenzar a medir el avance.</span>
              </div>
              <button
                type="button"
                className="project-alert-action-btn"
                onClick={() => onOpenNewTask && onOpenNewTask({ projectId: selectedProject.id })}
              >
                + Nueva Tarea
              </button>
            </div>
          ) : pct === 100 ? (
            <div className="project-detail-alert-box is-success">
              <span className="project-alert-icon">🏁</span>
              <div className="project-alert-content">
                <strong>¡Excelente trabajo!</strong>
                <span>El 100% de las tareas han sido completadas. Puedes marcar el proyecto como "Finalizado" en el selector superior.</span>
              </div>
            </div>
          ) : (
            <div className="project-detail-alert-box is-ontrack">
              <span className="project-alert-icon">✓</span>
              <div className="project-alert-content">
                <strong>Proyecto en ritmo:</strong>
                <span>
                  {selectedProject.targetDate && daysRemaining !== null
                    ? `Todas las tareas avanzan según lo programado. Quedan ${daysRemaining} día(s) para la fecha objetivo (${selectedProject.targetDate}).`
                    : 'Sin atrasos registrados. Las tareas avanzan con normalidad.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pestañas Principales: Tareas Asignadas vs Bitácora de Reuniones & Acuerdos */}
        <div className="project-detail-main-tabs" role="tablist" aria-label="Secciones del proyecto">
          <button
            type="button"
            className={`project-main-tab-btn ${activeDetailTab === 'tasks' ? 'is-active' : ''}`}
            onClick={() => setActiveDetailTab('tasks')}
            id="tab-project-tasks"
          >
            <span>📋 Tareas Asignadas</span>
            <span className="project-tab-counter">({projectTasks.length})</span>
          </button>
          <button
            type="button"
            className={`project-main-tab-btn ${activeDetailTab === 'meetings' ? 'is-active' : ''}`}
            onClick={() => setActiveDetailTab('meetings')}
            id="tab-project-meetings"
          >
            <span>📝 Bitácora de Reuniones & Acuerdos</span>
            <span className="project-tab-counter">({projectMeetingsCount})</span>
          </button>
        </div>

        {activeDetailTab === 'tasks' ? (
          /* 4. Lista & Control de Tareas Asignadas */
          <div className="project-detail-tasks-section">
            <div className="project-detail-tasks-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 className="project-detail-tasks-title">
                  <span>Tareas Asignadas</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', fontWeight: 500 }}>
                    ({projectTasks.length})
                  </span>
                </h2>

                {/* Filtro de tareas */}
                <div className="project-tasks-filter-tabs" role="tablist" aria-label="Filtrar tareas">
                  <button
                    type="button"
                    className={`project-tasks-tab-btn ${taskFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setTaskFilter('all')}
                  >
                    Todas ({taskCounts.all})
                  </button>
                  <button
                    type="button"
                    className={`project-tasks-tab-btn ${taskFilter === 'pending' ? 'is-active' : ''}`}
                    onClick={() => setTaskFilter('pending')}
                  >
                    Pendientes ({taskCounts.pending})
                  </button>
                  <button
                    type="button"
                    className={`project-tasks-tab-btn ${taskFilter === 'in_progress' ? 'is-active' : ''}`}
                    onClick={() => setTaskFilter('in_progress')}
                  >
                    En curso ({taskCounts.inProgress})
                  </button>
                  <button
                    type="button"
                    className={`project-tasks-tab-btn ${taskFilter === 'done' ? 'is-active' : ''}`}
                    onClick={() => setTaskFilter('done')}
                  >
                    Hechas ({taskCounts.done})
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="ui-btn ui-btn--primary ui-btn--small"
                onClick={() => onOpenNewTask && onOpenNewTask({ projectId: selectedProject.id })}
                title="Crear nueva tarea preasignada a este proyecto"
              >
                <Icons.Plus size={16} />
                <span>Nueva Tarea</span>
              </button>
            </div>

            {/* Listado de tareas */}
            {filteredProjectTasks.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>
                  {projectTasks.length === 0
                    ? 'Este proyecto aún no tiene tareas asignadas.'
                    : 'No hay tareas en el filtro seleccionado.'}
                </p>
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary ui-btn--small"
                  onClick={() => onOpenNewTask && onOpenNewTask({ projectId: selectedProject.id })}
                >
                  <Icons.Plus size={14} /> <span>Añadir primera tarea</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredProjectTasks.map((task) => {
                  const isDone = task.status === 'done';
                  const stageMeta = getTaskStageMeta(task.status);
                  const taskDaysOverdue = calculateDaysOverdue(task.dueDate || task.targetDate);
                  const isTaskOverdue = !isDone && (task.isOverdue || taskDaysOverdue > 0);

                  return (
                    <div
                      key={task.id}
                      className={`project-task-item ${isDone ? 'is-done' : ''}`}
                    >
                      {/* Botón Circular Check */}
                      <button
                        type="button"
                        className={`project-task-check-btn ${isDone ? 'is-checked' : ''}`}
                        onClick={() => handleToggleTask(task)}
                        title={isDone ? 'Marcar como pendiente' : 'Completar tarea'}
                        aria-label={isDone ? 'Marcar como pendiente' : 'Completar tarea'}
                      >
                        ✓
                      </button>

                      {/* Código de Tarea */}
                      {task.code && (
                        <span className="project-task-code">
                          {task.code}
                        </span>
                      )}

                      {/* Título y descripción */}
                      <div className="project-task-title-wrap">
                        <span className="project-task-title">{task.title}</span>
                        {task.description && (
                          <span style={{ fontSize: '11px', color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.description}
                          </span>
                        )}
                      </div>

                      {/* Meta fila */}
                      <div className="project-task-meta-row">
                        {/* Estado */}
                        <span
                          className="project-task-stage-badge"
                          style={{ background: stageMeta.bg, color: stageMeta.color }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageMeta.dot }} />
                          {stageMeta.label}
                        </span>

                        {/* Asignado */}
                        <span className="project-task-assignee">
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--nexus-teal)', color: '#ffffff', fontSize: '9px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(task.assignee || task.assignedTo || 'J')[0].toUpperCase()}
                          </span>
                          <span>{task.assignee || task.assignedTo || 'Jorge'}</span>
                        </span>

                        {/* Fecha Límite */}
                        {(task.dueDate || task.targetDate) && (
                          <span style={{ whiteSpace: 'nowrap', color: isTaskOverdue ? '#9B3B32' : 'inherit', fontWeight: isTaskOverdue ? 600 : 400 }}>
                            {isTaskOverdue
                              ? `⚠️ ${task.dueDate || task.targetDate} (${taskDaysOverdue}d)`
                              : (task.dueDate || task.targetDate)}
                          </span>
                        )}

                        {/* Botón Editar Tarea */}
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--small"
                          onClick={() => onUpdateWorkItem && onUpdateWorkItem(task)}
                          title="Editar tarea"
                          style={{ padding: '4px 6px' }}
                        >
                          <Icons.Edit size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <ProjectMeetingsTab
            project={selectedProject}
            meetings={meetings}
            workItems={workItems}
            todayStr={todayStr}
            currentUser={currentUser}
            onCreateMeeting={onCreateMeeting}
            onUpdateMeeting={onUpdateMeeting}
            onDeleteMeeting={onDeleteMeeting}
            onCreateTaskFromAction={onCreateTaskFromAction}
            onOpenNewTask={onOpenNewTask}
          />
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px)                                                    */
  /* ========================================================================= */
  if (isMobile) {
    return (
      <div style={{ flex: 1, padding: '16px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
        {/* Espacio Pill Group */}
        {onSpaceChange && (
          <div role="group" aria-label="Espacio" style={{ display: 'flex', background: '#EDF0F0', borderRadius: '8px', padding: '3px' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'work', label: 'Trabajo' },
              { id: 'personal', label: 'Personal' }
            ].map((s) => {
              const on = space === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSpaceChange(s.id)}
                  style={{
                    flex: 1,
                    height: '36px',
                    border: 0,
                    borderRadius: '6px',
                    font: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: on ? '#FFFFFF' : 'transparent',
                    color: on ? '#1D2A33' : '#5F6B76',
                    boxShadow: on ? '0 1px 2px rgba(15,52,70,0.15)' : 'none'
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 2x2 Grid KPIs (§10 Figma) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '8px' }}>
          <div style={{ padding: '12px 14px', borderRight: '1px solid #EDEFF0', borderBottom: '1px solid #EDEFF0' }}>
            <div style={{ fontSize: '12px', color: '#5F6B76' }}>Activos</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#1D2A33' }}>{kpis.activeCount}</div>
          </div>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #EDEFF0' }}>
            <div style={{ fontSize: '12px', color: '#5F6B76' }}>Tareas abiertas</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#1D2A33' }}>{kpis.openTasks}</div>
          </div>
          <div style={{ padding: '12px 14px', borderRight: '1px solid #EDEFF0' }}>
            <div style={{ fontSize: '12px', color: '#5F6B76' }}>Fuera de fecha</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: kpis.overdueCount > 0 ? '#9B3B32' : '#1D2A33' }}>
              {kpis.overdueCount}
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', color: '#5F6B76' }}>Avance</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#1D2A33' }}>{kpis.avgProgress}%</div>
          </div>
        </div>

        {/* Barra de Conteo y Filtro */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#3A4650' }}>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'proyecto' : 'proyectos'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ height: '32px', padding: '0 8px', border: '1px solid #DDE2E4', borderRadius: '6px', background: '#FFFFFF', color: '#5F6B76', fontSize: '12px', cursor: 'pointer' }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>

        {/* Tarjetas de Proyecto en Móvil */}
        {filteredProjects.length === 0 ? (
          space === 'personal' ? (
            <div style={{ background: '#FFFFFF', border: '1px dashed #C5CDD0', borderRadius: '8px', padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <strong style={{ color: '#1D2A33', fontSize: '15px' }}>Aún no tienes proyectos personales</strong>
              <span style={{ fontSize: '13px', color: '#5F6B76' }}>Lleva tus metas propias con el mismo seguimiento.</span>
              <button
                type="button"
                onClick={onCreatePersonalProject}
                style={{ height: '40px', padding: '0 14px', marginTop: '6px', border: '1px solid #DDE2E4', borderRadius: '6px', background: '#FFFFFF', color: '#2A6F62', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
              >
                Crear proyecto personal
              </button>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5F6B76', fontSize: '13px' }}>
              No se encontraron proyectos con los filtros aplicados.
            </div>
          )
        ) : (
          filteredProjects.map((p, idx) => {
            const tone = tones[idx % tones.length];
            const meta = statusMeta[p.status] || statusMeta.execution;
            const team = getTeamNames(p);
            const daysOverdue = calculateDaysOverdue(p.targetDate);
            const pct = p.progressPct || 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #DDE2E4',
                  borderRadius: '8px',
                  padding: '14px',
                  color: '#1D2A33',
                  cursor: 'pointer'
                }}
              >
                {/* Cabecera del Card */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      flex: 'none',
                      borderRadius: '6px',
                      background: tone,
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p.code || 'P'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontWeight: 600, lineHeight: '20px', fontSize: '14px' }}>{p.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.dot }} />
                      {meta.label} · {p.template || 'Kanban'}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F6B76" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '4px' }}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>

                {/* Barra de Progreso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#E3E8E7', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#4C8A45' : '#2A6F62' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#3A4650', fontWeight: 600 }}>{pct}%</span>
                </div>

                {/* Fila Inferior con tareas, fecha meta y equipo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#5F6B76' }}>
                    {p.doneTasks || 0} de {p.totalTasks || 0} tareas
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ whiteSpace: 'nowrap', color: p.isOverdue ? '#9B3B32' : '#5F6B76', fontWeight: p.isOverdue ? 600 : 400 }}>
                    {p.isOverdue ? `${daysOverdue}d atraso` : (p.targetDate ? `Meta ${p.targetDate}` : 'Sin fecha')}
                  </span>
                  <div style={{ display: 'flex' }}>
                    {team.slice(0, 3).map((name, i) => (
                      <span
                        key={name + i}
                        title={name}
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
                          background: tone,
                          marginLeft: i ? '-6px' : '0'
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET (§7.1)                                          */
  /* ========================================================================= */
  return (
    <div className="projects-view-container" style={{ padding: bp === 'tablet' ? '24px 28px' : undefined }}>
      {/* 1. Header (§3) */}
      <div className="projects-view-header">
        <div>
          <h1 className="projects-page-title">Mis Proyectos</h1>
          <p className="projects-page-subtitle">
            Control de portafolio y seguimiento de metas · {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="projects-header-actions">
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={onOpenNewProject}
          >
            <Icons.Plus /> <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Strip (§6.7: Single card with 4 cells) */}
      <KpiStrip
        items={[
          {
            label: 'Proyectos activos',
            value: kpis.activeCount,
            sublabel: `${filteredProjects.length} proyectos en vista`
          },
          {
            label: 'Tareas abiertas',
            value: kpis.openTasks,
            sublabel: 'Pendientes por resolver'
          },
          {
            label: 'Fuera de fecha',
            value: kpis.overdueCount,
            color: kpis.overdueCount > 0 ? 'var(--status-late-ink)' : 'inherit',
            sublabel: kpis.overdueCount > 0 ? `${kpis.overdueCount} con fecha vencida` : 'Todo en plazo'
          },
          {
            label: 'Avance general',
            value: `${kpis.avgProgress}%`,
            progress: kpis.avgProgress,
            sublabel: 'Rendimiento promedio'
          }
        ]}
      />

      {/* 3. Toolbar con Filtros y Tabs de Rol */}
      <div className="projects-toolbar">
        {/* Buscador */}
        <div className="projects-search-box">
          <Icons.Search />
          <input
            type="text"
            className="projects-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre o descripción..."
            aria-label="Buscar proyectos"
          />
          {searchTerm && (
            <button
              type="button"
              className="projects-search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs de Rol */}
        <div className="projects-role-tabs" role="tablist" aria-label="Filtrar por rol">
          <button
            type="button"
            role="tab"
            aria-selected={roleFilter === 'all'}
            className={`projects-role-tab ${roleFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roleFilter === 'lead'}
            className={`projects-role-tab ${roleFilter === 'lead' ? 'is-active' : ''}`}
            onClick={() => setRoleFilter('lead')}
          >
            Soy encargado ({leadCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roleFilter === 'collaborator'}
            className={`projects-role-tab ${roleFilter === 'collaborator' ? 'is-active' : ''}`}
            onClick={() => setRoleFilter('collaborator')}
          >
            Colaboro ({collabCount})
          </button>
        </div>

        {/* Selector de Etapa */}
        <div className="projects-stage-filter">
          <select
            className="projects-stage-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filtrar por etapa"
          >
            <option value="all">Todas las etapas</option>
            <option value="preproject">Preproyecto</option>
            <option value="review">En revisión</option>
            <option value="execution">En ejecución</option>
            <option value="completed">Finalizado</option>
            <option value="discarded">Descartado</option>
          </select>
        </div>
      </div>

      {/* 4. Tabla Moderna (§7.1) */}
      {filteredProjects.length === 0 ? (
        space === 'personal' ? (
          <EmptyState
            title="Aún no tienes proyectos personales"
            description="Crea tu primer proyecto personal para organizar tus metas, aprendizajes o tareas privadas."
            actionLabel="+ Crear proyecto personal"
            onAction={onCreatePersonalProject || onOpenNewProject}
          />
        ) : (
          <EmptyState
            title="No se encontraron proyectos"
            description="No hay proyectos que coincidan con los filtros aplicados. Intenta cambiar el rol, etapa o término de búsqueda."
            actionLabel="Limpiar filtros"
            onAction={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStageFilter('all');
            }}
          />
        )
      ) : (
        <div className="projects-table-card">
          <div className="projects-table-wrapper">
            <table className="projects-table" role="table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '34%' }}>Proyecto</th>
                  <th scope="col" style={{ width: '14%' }}>Espacio</th>
                  <th scope="col" style={{ width: '12%' }}>Estado</th>
                  <th scope="col" style={{ width: '15%' }}>Avance</th>
                  <th scope="col" style={{ width: '11%' }}>Equipo</th>
                  <th scope="col" style={{ width: '10%' }}>Fecha Meta</th>
                  <th scope="col" style={{ width: '4%', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const daysOverdue = calculateDaysOverdue(project.targetDate);
                  const isMenuOpen = openMenuProjectId === project.id;
                  const teamMembers = getTeamNames(project);

                  return (
                    <tr
                      key={project.id}
                      className="projects-table-row"
                    >
                      {/* 1. Proyecto (Código + Nombre + Descripción) */}
                      <td className="projects-cell-title">
                        <div className="projects-name-wrap">
                          <div className="projects-code-row">
                            {project.code && (
                              <span className="projects-code-badge">{project.code}</span>
                            )}
                            <button
                              type="button"
                              className="projects-name-link"
                              onClick={() => onSelectProject(project.id)}
                              title={`Abrir tablero de ${project.name}`}
                            >
                              {project.name}
                            </button>
                          </div>
                          {project.description && (
                            <p className="projects-desc-text" title={project.description}>
                              {project.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 2. Espacio & Metodología */}
                      <td className="projects-cell-space">
                        <span className="projects-space-tag">
                          {getSpaceLabel(project)}
                        </span>
                      </td>

                      {/* 3. Estado (StatusDot §6.2) */}
                      <td className="projects-cell-status">
                        <StatusDot status={project.status || 'execution'} />
                      </td>

                      {/* 4. Avance (ProgressBar 4px §6.3) */}
                      <td className="projects-cell-progress">
                        <ProgressBar
                          value={project.progressPct || 0}
                          sublabel={`${project.doneTasks || 0} de ${project.totalTasks || 0} tareas`}
                          size="small"
                        />
                      </td>

                      {/* 5. Equipo (AvatarGroup §6.4) */}
                      <td className="projects-cell-team">
                        <AvatarGroup
                          names={teamMembers}
                          max={3}
                          size={26}
                        />
                      </td>

                      {/* 6. Fecha Meta */}
                      <td className="projects-cell-date">
                        {project.targetDate ? (
                          project.isOverdue ? (
                            <div className="projects-date-overdue">
                              <span className="projects-date-text">{project.targetDate}</span>
                              <span className="projects-date-badge">
                                {daysOverdue > 0 ? `${daysOverdue} d atraso` : 'Atrasado'}
                              </span>
                            </div>
                          ) : (
                            <span className="projects-date-normal">{project.targetDate}</span>
                          )
                        ) : (
                          <span className="projects-date-none">Sin fecha</span>
                        )}
                      </td>

                      {/* 7. Acciones (Daily Check + Menú ⋯) */}
                      <td className="projects-cell-actions">
                        <div className="projects-actions-cluster">
                          {/* Botón Daily Check */}
                          <button
                            type="button"
                            className={`projects-daily-check-btn ${project.staleTasksCount > 0 ? 'is-pending' : 'is-clean'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDailyCheckProject(project);
                            }}
                            title={
                              project.staleTasksCount > 0
                                ? `Daily Check: ${project.staleTasksCount} tarea(s) requieren atención hoy`
                                : `Daily Check: Todo al día en ${project.name}`
                            }
                            aria-label={`Daily Check para ${project.name}`}
                          >
                            <Icons.DailyCheck />
                            {project.staleTasksCount > 0 && (
                              <span className="projects-daily-check-dot" />
                            )}
                          </button>

                          {/* Menú ⋯ */}
                          <div className="projects-menu-anchor" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`projects-menu-trigger ${isMenuOpen ? 'is-active' : ''}`}
                              onClick={() => setOpenMenuProjectId(isMenuOpen ? null : project.id)}
                              aria-haspopup="true"
                              aria-expanded={isMenuOpen}
                              title="Acciones del proyecto"
                              aria-label={`Opciones para ${project.name}`}
                            >
                              ⋯
                            </button>

                            {isMenuOpen && (
                              <div className="projects-action-dropdown" role="menu">
                                <button
                                  type="button"
                                  className="projects-dropdown-item"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuProjectId(null);
                                    onSelectProject(project.id);
                                  }}
                                >
                                  <Icons.Board /> <span>Abrir Tablero</span>
                                </button>
                                <button
                                  type="button"
                                  className="projects-dropdown-item"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuProjectId(null);
                                    onOpenStatusModal(project);
                                  }}
                                >
                                  <Icons.FileText /> <span>Estatus y Resumen</span>
                                </button>
                                <button
                                  type="button"
                                  className="projects-dropdown-item"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuProjectId(null);
                                    onOpenTeamModal(project);
                                  }}
                                >
                                  <Icons.UsersGear /> <span>Gestionar Equipo</span>
                                </button>
                                <button
                                  type="button"
                                  className="projects-dropdown-item"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuProjectId(null);
                                    onEditProject(project);
                                  }}
                                >
                                  <Icons.Edit /> <span>Editar Información</span>
                                </button>
                                <div className="projects-dropdown-divider" />
                                <button
                                  type="button"
                                  className="projects-dropdown-item is-danger"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuProjectId(null);
                                    onDeleteProject(project);
                                  }}
                                >
                                  <Icons.Trash /> <span>Eliminar Proyecto</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
