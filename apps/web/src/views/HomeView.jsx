import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Icons } from '../components/layout/NavIcons';

export function HomeView({
  projects = [],
  workItems = [],
  currentUser = null,
  todayStr = '',
  space = 'all',
  onSpaceChange,
  onSelectProject,
  onNavigate,
  onOpenNewProject,
  onOpenNewTask,
  onOpenDailyCheckin,
  onSubmitProgress,
  onUpdateWorkItem
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  // Filtros internos
  const [riskTab, setRiskTab] = useState('overdue'); // 'overdue' | 'due_soon' | 'stale'
  const [stagnationDays, setStagnationDays] = useState(15); // 7 | 15 | 30 días

  // Filtrado de proyectos por espacio seleccionado
  const filteredProjects = useMemo(() => {
    if (space === 'all') return projects;
    return projects.filter((p) => (p.space || 'work') === space);
  }, [projects, space]);

  const projectMap = useMemo(() => {
    const map = new Map();
    filteredProjects.forEach((p) => map.set(p.id, p));
    return map;
  }, [filteredProjects]);

  // Tareas pertenecientes a los proyectos en el espacio activo
  const filteredTasks = useMemo(() => {
    return workItems.filter((w) => projectMap.has(w.projectId));
  }, [workItems, projectMap]);

  // 1. SEMÁFORO DE SALUD DEL PORTAFOLIO
  const portfolioHealth = useMemo(() => {
    const active = filteredProjects.filter((p) => p.status !== 'completed' && p.status !== 'discarded');
    let healthyCount = 0;
    let attentionCount = 0;
    let criticalCount = 0;
    const completedCount = filteredProjects.filter((p) => p.status === 'completed').length;

    active.forEach((p) => {
      // Condición de Crítico: Proyecto con fecha vencida O con tareas atrasadas
      if (p.isOverdue || (p.targetDate && p.targetDate < todayStr)) {
        criticalCount++;
      } else if (p.staleTasksCount > 0 || (p.progressPct < 30 && p.targetDate)) {
        // En observación: tiene tareas sin reportes o avance bajo
        attentionCount++;
      } else {
        healthyCount++;
      }
    });

    const totalActive = active.length;
    const pctHealthy = totalActive > 0 ? Math.round((healthyCount / totalActive) * 100) : 0;
    const pctAttention = totalActive > 0 ? Math.round((attentionCount / totalActive) * 100) : 0;
    const pctCritical = totalActive > 0 ? Math.round((criticalCount / totalActive) * 100) : 0;

    // Avance global ponderado
    const totalTasks = filteredProjects.reduce((acc, p) => acc + (p.totalTasks || 0), 0);
    const doneTasks = filteredProjects.reduce((acc, p) => acc + (p.doneTasks || 0), 0);
    const globalProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      totalActive,
      healthyCount,
      attentionCount,
      criticalCount,
      completedCount,
      pctHealthy,
      pctAttention,
      pctCritical,
      globalProgress
    };
  }, [filteredProjects, todayStr]);

  // 2. RADAR DE TAREAS EN RIESGO (EARLY WARNING)
  const taskRisks = useMemo(() => {
    const activeTasks = filteredTasks.filter((t) => t.status !== 'done');
    const nowMs = new Date(todayStr || new Date().toISOString().split('T')[0]).getTime();
    const sevenDaysMs = nowMs + 7 * 24 * 60 * 60 * 1000;

    // Tareas vencidas
    const overdue = activeTasks.filter((t) => {
      const due = t.dueDate || t.targetDate;
      if (!due) return false;
      return new Date(due).getTime() < nowMs;
    });

    // Tareas por vencer en los próximos 7 días
    const dueSoon = activeTasks.filter((t) => {
      const due = t.dueDate || t.targetDate;
      if (!due) return false;
      const dueMs = new Date(due).getTime();
      return dueMs >= nowMs && dueMs <= sevenDaysMs;
    });

    // Tareas "Fantasma" / Sin anotaciones o reportes recientes
    const stale = activeTasks.filter((t) => {
      // Si tiene staleTasks nativo o días sin progreso
      if (t.isStale) return true;
      let lastDate = null;
      if (Array.isArray(t.progressLogs) && t.progressLogs.length > 0) {
        lastDate = new Date(t.progressLogs[t.progressLogs.length - 1].createdAt).getTime();
      } else if (t.updatedAt) {
        lastDate = new Date(t.updatedAt).getTime();
      } else if (t.createdAt) {
        lastDate = new Date(t.createdAt).getTime();
      }
      if (!lastDate) return true;
      const diffDays = Math.floor((nowMs - lastDate) / (1000 * 60 * 60 * 24));
      return diffDays >= 3;
    });

    return {
      overdue,
      dueSoon,
      stale
    };
  }, [filteredTasks, todayStr]);

  // 3. DETECTOR DE PROYECTOS ESTANCADOS
  const stagnantProjects = useMemo(() => {
    const active = filteredProjects.filter((p) => p.status !== 'completed' && p.status !== 'discarded');
    const nowMs = new Date(todayStr || new Date().toISOString().split('T')[0]).getTime();
    const thresholdMs = stagnationDays * 24 * 60 * 60 * 1000;

    const list = [];

    active.forEach((proj) => {
      const tasks = workItems.filter((w) => w.projectId === proj.id);
      let reason = '';
      let isStagnant = false;

      // 1. Proyecto sin tareas creadas (huérfano)
      if (tasks.length === 0) {
        isStagnant = true;
        reason = 'Proyecto sin tareas asignadas (congelado en planificación)';
      } else {
        // 2. Tareas en curso sin actividad reciente
        const activeTasks = tasks.filter((t) => t.status !== 'done');
        const doneTasks = tasks.filter((t) => t.status === 'done');

        // Fecha de última actividad registrada en el proyecto o tareas
        let lastActivityMs = proj.updatedAt ? new Date(proj.updatedAt).getTime() : 0;
        tasks.forEach((t) => {
          if (t.updatedAt) {
            const ms = new Date(t.updatedAt).getTime();
            if (ms > lastActivityMs) lastActivityMs = ms;
          }
          if (Array.isArray(t.progressLogs)) {
            t.progressLogs.forEach((l) => {
              if (l?.createdAt) {
                const ms = new Date(l.createdAt).getTime();
                if (ms > lastActivityMs) lastActivityMs = ms;
              }
            });
          }
        });

        const inactiveDays = lastActivityMs > 0 ? Math.floor((nowMs - lastActivityMs) / (1000 * 60 * 60 * 24)) : stagnationDays + 1;

        if (inactiveDays >= stagnationDays && proj.progressPct < 100) {
          isStagnant = true;
          reason = `Sin avance ni actualizaciones hace ${inactiveDays} días`;
        } else if (proj.staleTasksCount >= 3) {
          isStagnant = true;
          reason = `${proj.staleTasksCount} tareas activas desatendidas sin reporte`;
        } else if (proj.isOverdue && activeTasks.length > 0) {
          isStagnant = true;
          reason = `Fecha límite rebasada con ${activeTasks.length} tareas pendientes`;
        }
      }

      if (isStagnant) {
        list.push({
          ...proj,
          stagnantReason: reason
        });
      }
    });

    return list;
  }, [filteredProjects, workItems, stagnationDays, todayStr]);

  // 4. PRÓXIMAS METAS E HITOS
  const upcomingMilestones = useMemo(() => {
    const active = filteredProjects.filter((p) => p.status !== 'completed' && p.status !== 'discarded' && p.targetDate);
    const sorted = [...active].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    return sorted.slice(0, 4);
  }, [filteredProjects]);

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
          report: 'Tarea finalizada directamente desde el Centro de Mando.'
        });
      } else if (onUpdateWorkItem) {
        onUpdateWorkItem({ ...task, status: 'done', progressPct: 100 });
      }
    }
  };

  const handleGoToProject = (projectId) => {
    if (onSelectProject) onSelectProject(projectId);
    if (onNavigate) onNavigate('portfolio');
  };

  const currentRiskList =
    riskTab === 'overdue'
      ? taskRisks.overdue
      : riskTab === 'due_soon'
      ? taskRisks.dueSoon
      : taskRisks.stale;

  const dateHeading = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="home-dashboard-container">
      {/* 1. CABECERA EJECUTIVA DE INICIO */}
      <div className="home-hero-header">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <span className="home-hero-pulse-dot" />
            <span>Centro de Mando · Nexus</span>
          </div>
          <h1 className="home-hero-title">
            Buenos días, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Jorge'}
          </h1>
          <p className="home-hero-subtitle">
            {dateHeading.charAt(0).toUpperCase() + dateHeading.slice(1)} — Radar de salud del portafolio, tareas prioritarias y cuellos de botella.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="home-hero-actions">
          {/* Espacio Pill */}
          {onSpaceChange && (
            <div className="home-space-switch" role="group" aria-label="Espacio de trabajo">
              <button
                type="button"
                className={`home-space-pill ${space === 'all' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`home-space-pill ${space === 'work' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('work')}
              >
                Trabajo
              </button>
              <button
                type="button"
                className={`home-space-pill ${space === 'personal' ? 'is-active' : ''}`}
                onClick={() => onSpaceChange('personal')}
              >
                Personal
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={onOpenDailyCheckin}
              title="Revisar tareas y reportes del día"
            >
              <Icons.DailyCheck size={16} />
              <span>Daily Check</span>
              {taskRisks.stale.length > 0 && (
                <span className="top-daily-checkin-badge danger" style={{ marginLeft: 4 }}>
                  {taskRisks.stale.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className="ui-btn ui-btn--primary"
              onClick={onOpenNewTask}
              title="Registrar nueva tarea"
            >
              <Icons.Plus size={16} />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEMÁFORO DE SALUD DEL PORTAFOLIO (CARD PRINCIPAL CON GRÁFICA VISUAL) */}
      <div className="home-health-card">
        <div className="home-health-top">
          <div className="home-health-title-group">
            <span className="home-section-icon" style={{ background: 'var(--nexus-teal-50)', color: 'var(--nexus-teal)' }}>
              <Icons.Activity size={18} />
            </span>
            <div>
              <h2 className="home-health-heading">Semáforo de Salud y Eficiencia Global</h2>
              <span className="home-health-subtext">
                {portfolioHealth.totalActive} proyectos activos en seguimiento · {filteredProjects.length} totales en este espacio
              </span>
            </div>
          </div>

          <div className="home-health-score-badge">
            <span className="home-health-score-val">{portfolioHealth.globalProgress}%</span>
            <span className="home-health-score-lbl">Avance Global</span>
          </div>
        </div>

        {/* Barra Visual Segmentada de Distribución de Salud */}
        <div className="home-health-bar-wrapper" title="Distribución de salud del portafolio">
          <div
            className="home-health-segment is-healthy"
            style={{ width: `${portfolioHealth.pctHealthy}%` }}
            title={`En ritmo: ${portfolioHealth.healthyCount} proyectos (${portfolioHealth.pctHealthy}%)`}
          />
          <div
            className="home-health-segment is-attention"
            style={{ width: `${portfolioHealth.pctAttention}%` }}
            title={`En observación: ${portfolioHealth.attentionCount} proyectos (${portfolioHealth.pctAttention}%)`}
          />
          <div
            className="home-health-segment is-critical"
            style={{ width: `${portfolioHealth.pctCritical}%` }}
            title={`Críticos / Atrasados: ${portfolioHealth.criticalCount} proyectos (${portfolioHealth.pctCritical}%)`}
          />
        </div>

        {/* 4 KPIs de Salud */}
        <div className="home-health-grid">
          <div className="home-health-kpi is-healthy">
            <div className="home-health-kpi-dot" />
            <div className="home-health-kpi-info">
              <span className="home-health-kpi-val">{portfolioHealth.healthyCount}</span>
              <span className="home-health-kpi-label">En Ritmo</span>
              <span className="home-health-kpi-desc">Sin atrasos · Todo en orden</span>
            </div>
          </div>

          <div className="home-health-kpi is-attention">
            <div className="home-health-kpi-dot" />
            <div className="home-health-kpi-info">
              <span className="home-health-kpi-val">{portfolioHealth.attentionCount}</span>
              <span className="home-health-kpi-label">En Observación</span>
              <span className="home-health-kpi-desc">Tareas por vencer o desatendidas</span>
            </div>
          </div>

          <div className="home-health-kpi is-critical">
            <div className="home-health-kpi-dot" />
            <div className="home-health-kpi-info">
              <span className="home-health-kpi-val">{portfolioHealth.criticalCount}</span>
              <span className="home-health-kpi-label">Críticos / Vencidos</span>
              <span className="home-health-kpi-desc">Fecha rebasada o bloqueo severo</span>
            </div>
          </div>

          <div className="home-health-kpi is-completed">
            <div className="home-health-kpi-dot" />
            <div className="home-health-kpi-info">
              <span className="home-health-kpi-val">{portfolioHealth.completedCount}</span>
              <span className="home-health-kpi-label">Finalizados</span>
              <span className="home-health-kpi-desc">Metas cumplidas con éxito</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRID PRINCIPAL DE ACCIÓN: RADAR DE TAREAS EN RIESGO + DETECTOR DE PROYECTOS ESTANCADOS */}
      <div className="home-dual-grid">
        {/* PANEL IZQUIERDO: RADAR DE TAREAS EN RIESGO */}
        <div className="home-card">
          <div className="home-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="home-section-icon" style={{ background: '#FDE8E8', color: '#9B3B32' }}>
                <Icons.ClockAlert size={16} />
              </span>
              <div>
                <h3 className="home-card-title">Radar de Tareas en Riesgo</h3>
                <span className="home-card-subtitle">Alertas operativas que requieren atención inmediata</span>
              </div>
            </div>

            {/* Pestañas de Alerta */}
            <div className="home-tab-pills" role="tablist">
              <button
                type="button"
                className={`home-tab-pill ${riskTab === 'overdue' ? 'is-active is-danger' : ''}`}
                onClick={() => setRiskTab('overdue')}
              >
                Vencidas ({taskRisks.overdue.length})
              </button>
              <button
                type="button"
                className={`home-tab-pill ${riskTab === 'due_soon' ? 'is-active is-warning' : ''}`}
                onClick={() => setRiskTab('due_soon')}
              >
                Por Vencer 7d ({taskRisks.dueSoon.length})
              </button>
              <button
                type="button"
                className={`home-tab-pill ${riskTab === 'stale' ? 'is-active is-attention' : ''}`}
                onClick={() => setRiskTab('stale')}
              >
                Sin Anotaciones ({taskRisks.stale.length})
              </button>
            </div>
          </div>

          <div className="home-card-body">
            {currentRiskList.length === 0 ? (
              <div className="home-empty-state">
                <span style={{ fontSize: '24px' }}>✨</span>
                <strong>
                  {riskTab === 'overdue'
                    ? '¡Excelente! No tienes tareas vencidas.'
                    : riskTab === 'due_soon'
                    ? 'No hay tareas con vencimiento en los próximos 7 días.'
                    : 'Todas las tareas activas tienen reportes recientes.'}
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                  Las entregas y el seguimiento del equipo están al día.
                </span>
              </div>
            ) : (
              <div className="home-task-risk-list">
                {currentRiskList.slice(0, 6).map((task) => {
                  const proj = projectMap.get(task.projectId);
                  const isDone = task.status === 'done';
                  const assignee = task.assignee || task.assignedTo || 'Jorge';

                  return (
                    <div key={task.id} className="home-risk-task-item">
                      <button
                        type="button"
                        className={`project-task-check-btn ${isDone ? 'is-checked' : ''}`}
                        onClick={() => handleToggleTask(task)}
                        title={isDone ? 'Marcar pendiente' : 'Completar tarea'}
                        aria-label="Completar tarea"
                      >
                        ✓
                      </button>

                      <div className="home-risk-task-info">
                        <div className="home-risk-task-row">
                          {task.code && <span className="project-task-code">{task.code}</span>}
                          <span className="home-risk-task-title">{task.title}</span>
                        </div>

                        <div className="home-risk-task-meta">
                          {proj && (
                            <button
                              type="button"
                              className="home-risk-proj-tag"
                              onClick={() => handleGoToProject(proj.id)}
                              title={`Ir a ${proj.name}`}
                            >
                              📁 {proj.name}
                            </button>
                          )}
                          <span className="home-risk-assignee">
                            <span className="home-avatar-mini">{assignee[0].toUpperCase()}</span>
                            <span>{assignee}</span>
                          </span>
                          {(task.dueDate || task.targetDate) && (
                            <span className={`home-risk-date ${riskTab === 'overdue' ? 'is-late' : ''}`}>
                              📅 {task.dueDate || task.targetDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="ui-btn ui-btn--ghost ui-btn--small"
                        onClick={() => onUpdateWorkItem && onUpdateWorkItem(task)}
                        title="Ver o editar detalle de la tarea"
                      >
                        <Icons.Edit size={14} />
                      </button>
                    </div>
                  );
                })}

                {currentRiskList.length > 6 && (
                  <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                    <button
                      type="button"
                      className="ui-btn ui-btn--secondary ui-btn--small"
                      onClick={() => onNavigate && onNavigate('tasks')}
                    >
                      Ver todas las {currentRiskList.length} tareas en Tareas →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: DETECTOR DE PROYECTOS ESTANCADOS */}
        <div className="home-card">
          <div className="home-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="home-section-icon" style={{ background: '#FFF8E1', color: '#B98A1E' }}>
                <Icons.TrendingUp size={16} />
              </span>
              <div>
                <h3 className="home-card-title">Detector de Proyectos Estancados</h3>
                <span className="home-card-subtitle">Inactividad de avance o cuellos de botella detectados</span>
              </div>
            </div>

            {/* Selector de Rango de Inactividad */}
            <div className="home-tab-pills">
              <button
                type="button"
                className={`home-tab-pill ${stagnationDays === 7 ? 'is-active is-warning' : ''}`}
                onClick={() => setStagnationDays(7)}
              >
                7 días
              </button>
              <button
                type="button"
                className={`home-tab-pill ${stagnationDays === 15 ? 'is-active is-warning' : ''}`}
                onClick={() => setStagnationDays(15)}
              >
                15 días
              </button>
              <button
                type="button"
                className={`home-tab-pill ${stagnationDays === 30 ? 'is-active is-warning' : ''}`}
                onClick={() => setStagnationDays(30)}
              >
                30 días
              </button>
            </div>
          </div>

          <div className="home-card-body">
            {stagnantProjects.length === 0 ? (
              <div className="home-empty-state">
                <span style={{ fontSize: '24px' }}>🚀</span>
                <strong>¡Ningún proyecto estancado en este rango!</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                  Todos los proyectos en ejecución han registrado avance o reportes en los últimos {stagnationDays} días.
                </span>
              </div>
            ) : (
              <div className="home-stagnant-list">
                {stagnantProjects.map((p) => {
                  return (
                    <div key={p.id} className="home-stagnant-item">
                      <div className="home-stagnant-header">
                        <span className="project-detail-code-badge" style={{ width: 26, height: 26, fontSize: 11 }}>
                          {p.code || 'P'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="home-stagnant-name">{p.name}</h4>
                          <span className="home-stagnant-space">
                            {p.space === 'personal' ? 'Personal' : 'Trabajo'} · Avance: {p.progressPct || 0}%
                          </span>
                        </div>
                        <button
                          type="button"
                          className="ui-btn ui-btn--secondary ui-btn--small"
                          onClick={() => handleGoToProject(p.id)}
                          title="Abrir Hub de Detalle y Control de este proyecto"
                        >
                          <span>Ver Proyecto →</span>
                        </button>
                      </div>

                      {/* Motivo de Estancamiento */}
                      <div className="home-stagnant-reason-pill">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B98A1E', flexShrink: 0 }} />
                        <span>{p.stagnantReason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PRÓXIMAS FECHAS META E HITOS CRÍTICOS */}
      {upcomingMilestones.length > 0 && (
        <div className="home-card" style={{ marginTop: '20px' }}>
          <div className="home-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="home-section-icon" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                <Icons.Calendar size={16} />
              </span>
              <div>
                <h3 className="home-card-title">Próximos Hitos y Metas de Entrega</h3>
                <span className="home-card-subtitle">Proyectos con fecha de cierre más próxima en el calendario</span>
              </div>
            </div>

            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--small"
              onClick={() => onNavigate && onNavigate('timeline')}
            >
              <span>Ver en Cronograma Gantt →</span>
            </button>
          </div>

          <div className="home-card-body">
            <div className="home-milestones-grid">
              {upcomingMilestones.map((proj) => {
                const isOverdue = proj.isOverdue || proj.targetDate < todayStr;
                return (
                  <div
                    key={proj.id}
                    className="home-milestone-card"
                    onClick={() => handleGoToProject(proj.id)}
                    title={`Abrir ${proj.name}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="project-detail-code-badge" style={{ width: 24, height: 24, fontSize: 10 }}>
                        {proj.code || 'P'}
                      </span>
                      <span className={`home-milestone-badge ${isOverdue ? 'is-late' : ''}`}>
                        {isOverdue ? '⚠️ Vencido' : `Meta: ${proj.targetDate}`}
                      </span>
                    </div>

                    <strong className="home-milestone-title">{proj.name}</strong>

                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-500)', marginBottom: '4px' }}>
                        <span>Avance</span>
                        <strong>{proj.progressPct || 0}%</strong>
                      </div>
                      <div style={{ height: '4px', background: 'var(--surface-muted)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${proj.progressPct || 0}%`,
                            height: '100%',
                            background: proj.progressPct === 100 ? 'var(--nexus-green)' : 'var(--nexus-teal)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
