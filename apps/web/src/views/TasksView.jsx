import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { StatusDot, AvatarGroup, ProjectMark, EmptyState } from '../components/ui';
import { NavIcons } from '../components/layout/NavIcons';

export function TasksView({
  workItems = [],
  projects = [],
  currentUser = null,
  todayStr = '',
  onSubmitProgress,
  onUpdateWorkItem,
  onOpenNewTask,
  onEditTask
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const [groupBy, setGroupBy] = useState('project'); // 'project' | 'date' | 'status'
  const [onlyMine, setOnlyMine] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [closingTaskId, setClosingTaskId] = useState(null);
  const [closeForm, setCloseForm] = useState({
    closeType: 'completed',
    replacedBy: '',
    completionReport: ''
  });
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return workItems.filter((task) => {
      if (!showClosed && task.status === 'done') return false;

      if (onlyMine && currentUser) {
        const assignees = Array.isArray(task.assignees)
          ? task.assignees
          : (task.assignee ? task.assignee.split(',').map((s) => s.trim()) : []);
        const currentName = currentUser.name?.toLowerCase() || '';
        const isMine = assignees.some((a) => a.toLowerCase().includes('jorge') || (currentName && a.toLowerCase().includes(currentName)));
        if (!isMine) return false;
      }

      return true;
    });
  }, [workItems, showClosed, onlyMine, currentUser]);

  // Agrupación
  const groupedSections = useMemo(() => {
    if (groupBy === 'project') {
      const map = {};
      projects.forEach((p) => {
        map[p.id] = { id: p.id, title: p.name, code: p.code, project: p, tasks: [] };
      });
      // Tareas sin proyecto o proyectos no encontrados
      map['unassigned'] = { id: 'unassigned', title: 'Sin proyecto asignado', code: '', project: null, tasks: [] };

      filteredTasks.forEach((t) => {
        const pId = t.projectId || 'unassigned';
        if (!map[pId]) {
          map[pId] = { id: pId, title: 'Proyecto ' + pId, code: '', project: null, tasks: [] };
        }
        map[pId].tasks.push(t);
      });

      return Object.values(map).filter((sec) => sec.tasks.length > 0);
    }

    if (groupBy === 'status') {
      const order = [
        { key: 'backlog', title: 'Pendiente' },
        { key: 'in_progress', title: 'En curso' },
        { key: 'review', title: 'En validación / revisión' },
        { key: 'done', title: 'Cerradas / Hecho' }
      ];

      return order.map((sec) => ({
        id: sec.key,
        title: sec.title,
        statusKey: sec.key,
        tasks: filteredTasks.filter((t) => (t.status || 'backlog') === sec.key)
      })).filter((sec) => sec.tasks.length > 0);
    }

    if (groupBy === 'date') {
      const overdue = [];
      const today = [];
      const thisWeek = [];
      const later = [];
      const noDate = [];
      const closed = [];

      filteredTasks.forEach((t) => {
        if (t.status === 'done') {
          closed.push(t);
          return;
        }
        if (!t.dueDate) {
          noDate.push(t);
          return;
        }
        if (t.dueDate < todayStr) {
          overdue.push(t);
        } else if (t.dueDate === todayStr) {
          today.push(t);
        } else {
          const d1 = new Date(todayStr + 'T12:00:00').getTime();
          const d2 = new Date(t.dueDate + 'T12:00:00').getTime();
          const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            thisWeek.push(t);
          } else {
            later.push(t);
          }
        }
      });

      return [
        { id: 'overdue', title: 'Vencidas (Requieren cierre o fecha)', isLate: true, tasks: overdue },
        { id: 'today', title: 'Para Hoy', tasks: today },
        { id: 'thisWeek', title: 'Esta Semana', tasks: thisWeek },
        { id: 'later', title: 'Más adelante', tasks: later },
        { id: 'noDate', title: 'Sin fecha límite', tasks: noDate },
        { id: 'closed', title: 'Cerradas', tasks: closed }
      ].filter((sec) => sec.tasks.length > 0);
    }

    return [];
  }, [groupBy, filteredTasks, projects, todayStr]);

  // Manejador de inicio de cierre
  const handleStartClosing = (task) => {
    if (task.status === 'done') {
      if (confirm(`¿Deseas reabrir la tarea "${task.title}" a estado "En curso"?`)) {
        onUpdateWorkItem(task.id, { status: 'in_progress' });
      }
      return;
    }

    setClosingTaskId(task.id);
    setCloseForm({
      closeType: 'completed',
      replacedBy: '',
      completionReport: ''
    });
  };

  const handleCancelClose = () => {
    setClosingTaskId(null);
    setCloseForm({ closeType: 'completed', replacedBy: '', completionReport: '' });
  };

  const handleConfirmClose = async (taskId) => {
    const text = closeForm.completionReport.trim();
    if (text.length < 20) {
      alert('El registro de cierre debe tener al menos 20 caracteres explicando qué se hizo o justificando la finalización.');
      return;
    }

    setIsSubmittingClose(true);
    try {
      await onUpdateWorkItem(taskId, {
        status: 'done',
        closeType: closeForm.closeType,
        replacedBy: closeForm.closeType === 'replaced' ? closeForm.replacedBy : undefined,
        completionReport: text,
        closedAt: new Date().toISOString()
      });

      if (onSubmitProgress) {
        await onSubmitProgress(taskId, `[Cierre: ${closeForm.closeType}] ${text}`);
      }

      setClosingTaskId(null);
    } catch (err) {
      alert(err.message || 'Error al cerrar la tarea');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const isFormValid = closeForm.completionReport.trim().length >= 20;

  const totalOpenCount = useMemo(() => workItems.filter((t) => t.status !== 'done').length, [workItems]);
  const totalLateCount = useMemo(() => workItems.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length, [workItems, todayStr]);

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px - §14 Figma)                                         */
  /* ========================================================================= */
  if (isMobile) {
    return (
      <div style={{ flex: 1, padding: '12px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
        {groupedSections.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#5F6B76', fontSize: '13px' }}>
            No hay tareas en esta vista.
          </div>
        ) : (
          groupedSections.map((sec) => (
            <section key={sec.id} aria-label={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: sec.isLate ? '#9B3B32' : '#2A6F62',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none'
                  }}
                >
                  {sec.code ? sec.code.slice(0, 2) : 'T'}
                </span>
                <strong style={{ fontSize: '13px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1D2A33' }}>
                  {sec.title}
                </strong>
                <span style={{ fontSize: '12px', color: '#5F6B76' }}>{sec.tasks.length}</span>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '8px', overflow: 'hidden' }}>
                {sec.tasks.map((t) => {
                  const isDone = t.status === 'done';
                  const isLate = t.dueDate && t.dueDate < todayStr && !isDone;
                  const isClosing = closingTaskId === t.id;

                  return (
                    <div key={t.id} style={{ borderBottom: '1px solid #F0F2F2' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '6px 12px 6px 4px' }}>
                        {/* Checkbox circular táctil 44x44 */}
                        <button
                          type="button"
                          onClick={() => handleStartClosing(t)}
                          aria-label={`Cerrar tarea ${t.code || t.title}`}
                          style={{
                            width: '44px',
                            height: '44px',
                            flex: 'none',
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: isDone ? '2px solid #4C8A45' : '2px solid #C5CDD0',
                              background: isDone ? '#4C8A45' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {isDone && '✓'}
                          </span>
                        </button>

                        <div
                          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '10px', cursor: onEditTask ? 'pointer' : 'default' }}
                          onClick={() => onEditTask && onEditTask(t)}
                          title="Editar tarea"
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              lineHeight: '20px',
                              fontSize: '14px',
                              color: isDone ? '#5F6B76' : '#1D2A33',
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}
                          >
                            {t.title}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5F6B76' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDone ? '#4C8A45' : isLate ? '#9B3B32' : '#2A6F62' }} />
                            <span>{t.code || `T-${t.id}`} · {isDone ? 'Hecho' : (t.status === 'review' ? 'Validación' : t.status === 'in_progress' ? 'En curso' : 'Pendiente')}</span>
                            {' · '}
                            <span style={{ color: isLate ? '#9B3B32' : '#5F6B76', fontWeight: isLate ? 600 : 400 }}>
                              {isLate ? `Venció ${t.dueDate}` : (t.dueDate || 'Sin fecha')}
                            </span>
                          </span>
                        </div>

                        {/* Botón Editar Móvil */}
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask && onEditTask(t);
                          }}
                          title="Editar tarea"
                          style={{ padding: '4px 6px', color: '#5F6B76', marginTop: '6px' }}
                        >
                          <NavIcons.Edit size={14} />
                        </button>
                      </div>

                      {/* Formulario de cierre si está abierto */}
                      {isClosing && (
                        <div style={{ padding: '12px', background: '#F4F8F7', borderTop: '1px solid #D5E3DF' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F5449', marginBottom: '8px' }}>
                            Registro de Cierre Obligatorio (§7.4.1)
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            {[
                              { id: 'completed', label: 'Completada' },
                              { id: 'replaced', label: 'Reemplazada' },
                              { id: 'cancelled', label: 'Descartada' }
                            ].map((tp) => (
                              <button
                                key={tp.id}
                                type="button"
                                onClick={() => setCloseForm((f) => ({ ...f, closeType: tp.id }))}
                                style={{
                                  flex: 1,
                                  height: '32px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  border: closeForm.closeType === tp.id ? '2px solid #2A6F62' : '1px solid #DDE2E4',
                                  borderRadius: '4px',
                                  background: closeForm.closeType === tp.id ? '#FFFFFF' : '#EDF0F0',
                                  color: closeForm.closeType === tp.id ? '#1D2A33' : '#5F6B76',
                                  cursor: 'pointer'
                                }}
                              >
                                {tp.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={closeForm.completionReport}
                            onChange={(e) => setCloseForm((f) => ({ ...f, completionReport: e.target.value }))}
                            placeholder="Explica qué se hizo o justifica el cierre (mín. 20 caracteres)..."
                            style={{ width: '100%', border: '1px solid #C5CDD0', borderRadius: '6px', padding: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', color: isFormValid ? '#1F5449' : '#9B3B32' }}>
                              {closeForm.completionReport.trim().length}/20 caracteres
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={handleCancelClose}
                                style={{ height: '32px', padding: '0 10px', border: '1px solid #DDE2E4', borderRadius: '4px', background: '#FFFFFF', fontSize: '12px', cursor: 'pointer' }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={!isFormValid || isSubmittingClose}
                                onClick={() => handleConfirmClose(t.id)}
                                style={{
                                  height: '32px',
                                  padding: '0 12px',
                                  border: 0,
                                  borderRadius: '4px',
                                  background: isFormValid ? '#2A6F62' : '#C5CDD0',
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: isFormValid ? 'pointer' : 'not-allowed'
                                }}
                              >
                                Guardar cierre
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET (§7.4)                                          */
  /* ========================================================================= */
  return (
    <div className="tasks-view-container" style={{ padding: bp === 'tablet' ? '24px 28px' : undefined }}>
      {/* 1. CABECERA DE LA VISTA */}
      <div className="tasks-view-header">
        <div>
          <h1 className="tasks-page-title">Mis tareas</h1>
          <p className="tasks-page-subtitle">
            {totalOpenCount} tareas abiertas {totalLateCount > 0 ? `· ${totalLateCount} fuera de fecha` : '· Al día'}
          </p>
        </div>

        <button
          type="button"
          className="ui-btn ui-btn--primary"
          onClick={onOpenNewTask}
        >
          <NavIcons.Plus size={18} />
          <span>Nueva tarea</span>
        </button>
      </div>

      {/* 2. BARRA DE FILTROS & SEGMENTADOS */}
      <div className="tasks-filter-bar">
        {/* Agrupación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tasks-filter-label">Agrupar por:</span>
          <div className="segmented-control" style={{ width: 'auto' }}>
            <button
              type="button"
              className={`segmented-btn ${groupBy === 'project' ? 'is-active' : ''}`}
              onClick={() => setGroupBy('project')}
            >
              Proyecto
            </button>
            <button
              type="button"
              className={`segmented-btn ${groupBy === 'date' ? 'is-active' : ''}`}
              onClick={() => setGroupBy('date')}
            >
              Fecha
            </button>
            <button
              type="button"
              className={`segmented-btn ${groupBy === 'status' ? 'is-active' : ''}`}
              onClick={() => setGroupBy('status')}
            >
              Estado
            </button>
          </div>
        </div>

        {/* Switches de filtro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label className="tasks-checkbox-label">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            <span>Asignadas a mí</span>
          </label>

          <label className="tasks-checkbox-label">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
            <span>Mostrar cerradas</span>
          </label>
        </div>
      </div>

      {/* 3. GRUPOS DE TAREAS */}
      {groupedSections.length === 0 ? (
        <EmptyState
          title="No hay tareas que coincidan con los filtros"
          description={
            onlyMine
              ? 'No tienes tareas asignadas pendientes en este espacio. Puedes desmarcar "Asignadas a mí" para ver las tareas del equipo.'
              : 'Todas las tareas activas están al día o no hay tareas creadas aún.'
          }
          actionLabel="Crear nueva tarea"
          onAction={onOpenNewTask}
        />
      ) : (
        <div className="tasks-sections-stack">
          {groupedSections.map((sec) => (
            <div key={sec.id} className="tasks-group-card">
              {/* Cabecera del grupo */}
              <div className="tasks-group-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {sec.project ? (
                    <ProjectMark project={sec.project} showName={false} />
                  ) : (
                    <span className="ui-status__dot" style={{ background: sec.isLate ? 'var(--status-late-ink)' : 'var(--nexus-teal)' }} />
                  )}
                  <h3 className="tasks-group-title">
                    {sec.code ? `${sec.code} · ` : ''}{sec.title}
                  </h3>
                </div>
                <span className="tasks-group-badge">
                  {sec.tasks.length} {sec.tasks.length === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>

              {/* Lista de filas de tarea */}
              <div className="tasks-table-body">
                {sec.tasks.map((task) => {
                  const isDone = task.status === 'done';
                  const isClosing = closingTaskId === task.id;
                  const isLate = task.dueDate && task.dueDate < todayStr && !isDone;
                  const proj = projects.find((p) => p.id === task.projectId);

                  return (
                    <div key={task.id} className={`tasks-table-row-wrap ${isDone ? 'is-done' : ''}`}>
                      <div className="tasks-table-row">
                        {/* Círculo de Cierre / Checkbox */}
                        <button
                          type="button"
                          className={`tasks-circle-check ${isDone ? 'is-checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartClosing(task);
                          }}
                          title={isDone ? 'Tarea cerrada (clic para reabrir)' : 'Completar y registrar cierre de esta tarea'}
                          aria-label={isDone ? 'Reabrir tarea' : 'Cerrar tarea'}
                        >
                          {isDone && <span className="tasks-circle-check-tick">✓</span>}
                        </button>

                        {/* Código */}
                        <span className="tasks-code-cell">
                          {task.code || proj?.code || 'WI'}
                        </span>

                        {/* Título & Detalle */}
                        <div
                          className="tasks-title-cell"
                          onClick={() => onEditTask && onEditTask(task)}
                          style={{ cursor: onEditTask ? 'pointer' : 'default' }}
                          title="Editar tarea"
                        >
                          <span className={`tasks-title-text ${isDone ? 'is-struck' : ''}`}>
                            {task.title}
                          </span>

                          {/* Si está cerrada, mostrar reporte de cierre */}
                          {isDone && (
                            <div className="tasks-closure-summary">
                              <span style={{ fontWeight: 600, color: 'var(--nexus-green)' }}>
                                [{task.closeType === 'cancelled' ? 'Cancelada' : task.closeType === 'replaced' ? 'Reemplazada' : 'Completada'}]
                              </span>{' '}
                              <span>{task.completionReport || 'Sin registro (anterior a la regla de cierre)'}</span>
                            </div>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="tasks-status-cell">
                          <StatusDot status={task.status || 'backlog'} />
                        </div>

                        {/* Prioridad */}
                        <div className="tasks-priority-cell">
                          {task.priority === 'high' ? (
                            <span className="tasks-priority-high">↑ Alta</span>
                          ) : (
                            <span className="tasks-priority-normal">Media</span>
                          )}
                        </div>

                        {/* Avatares */}
                        <div className="tasks-assignees-cell">
                          <AvatarGroup
                            names={
                              Array.isArray(task.assignees) && task.assignees.length > 0
                                ? task.assignees
                                : (task.assignee ? [task.assignee] : [])
                            }
                            size={24}
                          />
                        </div>

                        {/* Fecha */}
                        <div className="tasks-date-cell">
                          {task.dueDate ? (
                            <span className={`tasks-date-pill ${isLate ? 'is-late' : ''}`}>
                              {isLate ? `Vencida: ${task.dueDate}` : task.dueDate}
                            </span>
                          ) : (
                            <span className="tasks-date-none">Sin fecha</span>
                          )}
                        </div>

                        {/* Botón Editar */}
                        <div className="tasks-action-cell" style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="ui-btn ui-btn--ghost ui-btn--small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask && onEditTask(task);
                            }}
                            title="Editar tarea"
                            style={{ padding: '4px 6px', color: 'var(--ink-500)' }}
                          >
                            <NavIcons.Edit size={14} />
                          </button>
                        </div>
                      </div>

                      {/* FORMULARIO DE CIERRE INLINE (§7.4.1) */}
                      {isClosing && (
                        <div className="tasks-inline-closure-box" role="region" aria-label="Cierre de tarea">
                          <div className="tasks-closure-header">
                            <strong className="tasks-closure-title">
                              Registro de Cierre Obligatorio (§7.4.1)
                            </strong>
                            <p className="tasks-closure-subtitle">
                              Para garantizar auditoría y trazabilidad, describe la resolución con al menos 20 caracteres.
                            </p>
                          </div>

                          <div className="tasks-closure-fields">
                            <div className="tasks-closure-type-group">
                              <label className="ui-label">Tipo de resolución *</label>
                              <div className="tasks-closure-type-pills">
                                <label className={`tasks-closure-type-pill ${closeForm.closeType === 'completed' ? 'is-selected' : ''}`}>
                                  <input
                                    type="radio"
                                    name={`closeType-${task.id}`}
                                    value="completed"
                                    checked={closeForm.closeType === 'completed'}
                                    onChange={(e) => setCloseForm({ ...closeForm, closeType: e.target.value })}
                                  />
                                  <span>✓ Completada con éxito</span>
                                </label>

                                <label className={`tasks-closure-type-pill ${closeForm.closeType === 'replaced' ? 'is-selected' : ''}`}>
                                  <input
                                    type="radio"
                                    name={`closeType-${task.id}`}
                                    value="replaced"
                                    checked={closeForm.closeType === 'replaced'}
                                    onChange={(e) => setCloseForm({ ...closeForm, closeType: e.target.value })}
                                  />
                                  <span>⇄ Reemplazada por otra</span>
                                </label>

                                <label className={`tasks-closure-type-pill ${closeForm.closeType === 'cancelled' ? 'is-selected' : ''}`}>
                                  <input
                                    type="radio"
                                    name={`closeType-${task.id}`}
                                    value="cancelled"
                                    checked={closeForm.closeType === 'cancelled'}
                                    onChange={(e) => setCloseForm({ ...closeForm, closeType: e.target.value })}
                                  />
                                  <span>✕ Descartada / Cancelada</span>
                                </label>
                              </div>
                            </div>

                            {closeForm.closeType === 'replaced' && (
                              <div className="tasks-closure-field">
                                <label className="ui-label">ID o Código de la tarea que la reemplaza *</label>
                                <input
                                  type="text"
                                  className="ui-input"
                                  placeholder="Ej: WI-104 o T-58"
                                  value={closeForm.replacedBy}
                                  onChange={(e) => setCloseForm({ ...closeForm, replacedBy: e.target.value })}
                                />
                              </div>
                            )}

                            <div className="tasks-closure-field">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="ui-label">Reporte / Justificación de cierre *</label>
                                <span className={`tasks-char-counter ${isFormValid ? 'is-valid' : 'is-invalid'}`}>
                                  {closeForm.completionReport.trim().length} / 20 caracteres mín.
                                </span>
                              </div>
                              <textarea
                                className="ui-textarea"
                                rows={3}
                                placeholder="Describe el resultado de la tarea, entregables, enlaces a documentos o justificación del descarte..."
                                value={closeForm.completionReport}
                                onChange={(e) => setCloseForm({ ...closeForm, completionReport: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="tasks-closure-actions">
                            <button
                              type="button"
                              className="ui-btn ui-btn--secondary"
                              onClick={handleCancelClose}
                              disabled={isSubmittingClose}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="ui-btn ui-btn--primary"
                              onClick={() => handleConfirmClose(task.id)}
                              disabled={!isFormValid || isSubmittingClose}
                            >
                              {isSubmittingClose ? 'Guardando...' : 'Confirmar Cierre de Tarea'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
