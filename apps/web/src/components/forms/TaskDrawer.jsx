import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../ui';
import { AssigneeDropdownPicker } from './AssigneeDropdownPicker';

export function TaskDrawer({
  isOpen,
  onClose,
  onSubmit,
  projects = [],
  selectedProjectId = '',
  initialData = null,
  isEdit = false,
  currentUser = null,
  teamDirectory = []
}) {
  const [formData, setFormData] = useState({
    title: '',
    projectId: selectedProjectId || (projects[0]?.id || ''),
    assignee: currentUser?.name || 'Jorge',
    assignees: [currentUser?.name || 'Jorge'],
    startDate: '',
    dueDate: '',
    type: 'task',
    priority: 'medium',
    description: '',
    phaseIds: []
  });

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        projectId: initialData.projectId || selectedProjectId || (projects[0]?.id || ''),
        assignee: initialData.assignee || currentUser?.name || 'Jorge',
        assignees: Array.isArray(initialData.assignees) && initialData.assignees.length > 0
          ? initialData.assignees
          : (initialData.assignee ? [initialData.assignee] : [currentUser?.name || 'Jorge']),
        startDate: initialData.startDate || (initialData.createdAt ? initialData.createdAt.split('T')[0] : ''),
        dueDate: initialData.dueDate || '',
        type: initialData.type || 'task',
        priority: initialData.priority || 'medium',
        description: initialData.description || '',
        phaseIds: Array.isArray(initialData.phaseIds) ? initialData.phaseIds : []
      });
    } else {
      setFormData({
        title: '',
        projectId: selectedProjectId || (projects[0]?.id || ''),
        assignee: currentUser?.name || 'Jorge',
        assignees: [currentUser?.name || 'Jorge'],
        startDate: '',
        dueDate: '',
        type: 'task',
        priority: 'medium',
        description: '',
        phaseIds: []
      });
    }
  }, [initialData, isOpen, selectedProjectId, projects, currentUser]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 4 campos obligatorios (§7.7): Título, Proyecto, Responsable, Fecha límite
  const validTitle = formData.title.trim().length >= 2;
  const validProject = Boolean(formData.projectId);
  const validAssignee = Boolean(
    (Array.isArray(formData.assignees) && formData.assignees.length > 0) ||
    (typeof formData.assignee === 'string' && formData.assignee.trim())
  );
  const validDueDate = Boolean(formData.dueDate);

  const completedCount = [validTitle, validProject, validAssignee, validDueDate].filter(Boolean).length;
  const isValid = completedCount === 4;

  const selectedProjectObj = projects.find((p) => p.id === formData.projectId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const assigneesList = Array.isArray(formData.assignees) && formData.assignees.length > 0
      ? formData.assignees
      : (formData.assignee ? formData.assignee.split(',').map((s) => s.trim()).filter(Boolean) : [currentUser?.name || 'Jorge']);

    const payload = {
      ...formData,
      title: formData.title.trim(),
      assignees: assigneesList,
      assignee: assigneesList.join(', '),
      phaseIds: (selectedProjectObj?.hasPhases && Array.isArray(selectedProjectObj.phases) && selectedProjectObj.phases.length > 0)
        ? (formData.phaseIds && formData.phaseIds.length > 0 ? formData.phaseIds : [selectedProjectObj.phases[0].id])
        : []
    };

    onSubmit(payload);
  };

  return (
    <div className="ui-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar Tarea' : 'Nueva Tarea'}>
      <aside className="ui-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="ui-drawer-header">
          <div className="ui-drawer-title-group">
            <span className="ui-drawer-eyebrow">Gestión de Tareas</span>
            <h2 className="ui-drawer-title">{isEdit ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          </div>
          <button
            type="button"
            className="ui-drawer-close-btn"
            onClick={onClose}
            aria-label="Cerrar panel"
            title="Cerrar (Esc)"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Formulario */}
        <form id="task-drawer-form" onSubmit={handleSubmit} className="ui-drawer-body">
          <div className="ui-drawer-notice">
            <span>Completa los <strong>4 campos obligatorios</strong> para registrar la tarea.</span>
          </div>

          {/* 1. Título */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="task-title">
              1. Título de la tarea <span className="ui-drawer-req">*</span>
            </label>
            <input
              id="task-title"
              ref={firstInputRef}
              type="text"
              className="ui-drawer-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej. Revisar cotización de infraestructura o Elaborar informe"
              required
            />
          </div>

          {/* 2. Proyecto */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="task-project">
              2. Proyecto asociado <span className="ui-drawer-req">*</span>
            </label>
            <select
              id="task-project"
              className="ui-drawer-select"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              required
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.code ? `[${proj.code}] ` : ''}{proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* ASIGNACIÓN A FASES (Solo si el proyecto seleccionado tiene fases) */}
          {selectedProjectObj?.hasPhases && Array.isArray(selectedProjectObj.phases) && selectedProjectObj.phases.length > 0 && (
            <div className="ui-drawer-field" style={{ background: '#F8FAFB', padding: '12px 14px', borderRadius: '8px', border: '1px solid #DDE2E4' }}>
              <label className="ui-drawer-label" style={{ color: '#2A6F62', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 6px 0' }}>
                <span>Fases asignadas a esta tarea</span>
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#5F6B76' }}>(Selecciona 1 o más)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedProjectObj.phases.map((ph) => {
                  const isChecked = (formData.phaseIds || []).includes(ph.id);
                  return (
                    <label key={ph.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#1D2A33' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = formData.phaseIds || [];
                          const updated = e.target.checked
                            ? [...current, ph.id]
                            : current.filter((id) => id !== ph.id);
                          setFormData({ ...formData, phaseIds: updated });
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>{ph.name} <small style={{ color: '#5F6B76' }}>(Meta: {ph.targetDate})</small></span>
                    </label>
                  );
                })}
              </div>
              {(formData.phaseIds || []).length > 1 && (
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#47626D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🔗 Tarea compartida entre {(formData.phaseIds || []).length} fases. Aparecerá enlazada en cada carril.</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Responsable */}
          <div className="ui-drawer-field">
            <AssigneeDropdownPicker
              id="task-assignee"
              label="3. Responsable / Asignado"
              required={true}
              selectedAssignees={formData.assignees || (formData.assignee ? [formData.assignee] : [currentUser?.name || 'Jorge'])}
              onChangeAssignees={(newAssignees) => {
                setFormData({
                  ...formData,
                  assignees: newAssignees,
                  assignee: newAssignees.join(', ')
                });
              }}
              teamDirectory={teamDirectory}
              currentUser={currentUser}
              hint="Selecciona de la lista desplegable los usuarios del sistema. Puedes asignar uno o varios responsables."
            />
          </div>

          {/* 4. Fechas y Plazos */}
          <div className="ui-drawer-grid-2">
            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="task-start-date">
                Fecha de inicio
              </label>
              <input
                id="task-start-date"
                type="date"
                className="ui-drawer-input"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="task-due-date">
                4. Fecha límite / entrega <span className="ui-drawer-req">*</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                className="ui-drawer-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.startDate && formData.dueDate && (
            <div style={{ fontSize: '11.5px', color: '#2A6F62', fontWeight: 600, marginTop: '-6px', marginBottom: '10px', background: '#F0F9F6', padding: '6px 12px', borderRadius: '6px', border: '1px solid #D5EBE3' }}>
              ⏱️ Duración estimada: {(() => {
                const d1 = new Date(formData.startDate + 'T12:00:00').getTime();
                const d2 = new Date(formData.dueDate + 'T12:00:00').getTime();
                const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                if (diff < 0) return '⚠️ La fecha límite es anterior a la fecha de inicio';
                if (diff === 0) return 'Mismo día';
                if (diff === 1) return '1 día';
                if (diff < 7) return `${diff} días`;
                const w = Math.round(diff / 7);
                return `${diff} días (~${w} sem)`;
              })()}
            </div>
          )}

          <div className="ui-drawer-divider" />
          <span className="ui-drawer-section-heading">Detalles Adicionales (Opcionales)</span>

          {/* Tipo & Prioridad */}
          <div className="ui-drawer-grid-2">
            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="task-type">Tipo</label>
              <select
                id="task-type"
                className="ui-drawer-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="task">Tarea estándar</option>
                <option value="story">Historia de usuario</option>
                <option value="bug">Error / Corrección</option>
                <option value="milestone">Hito clave</option>
                <option value="risk">Riesgo identificado</option>
              </select>
            </div>
            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="task-priority">Prioridad</label>
              <select
                id="task-priority"
                className="ui-drawer-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media (por defecto)</option>
                <option value="high">Alta / Urgente</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="task-desc">Descripción / Criterio de Aceptación</label>
            <textarea
              id="task-desc"
              rows="3"
              className="ui-drawer-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles sobre lo que se espera para dar por completada la tarea..."
            />
          </div>
        </form>

        {/* Pie Fijo con Contador (§7.7) */}
        <div className="ui-drawer-footer">
          <div className="ui-drawer-counter">
            <span className={`ui-drawer-counter-badge ${isValid ? 'is-valid' : ''}`}>
              {completedCount}/4
            </span>
            <span className="ui-drawer-counter-text">
              {isValid ? 'Todos los campos obligatorios listos' : `${completedCount} de 4 campos obligatorios`}
            </span>
          </div>
          <div className="ui-drawer-footer-actions">
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="task-drawer-form"
              className="ui-btn ui-btn--primary"
              disabled={!isValid}
            >
              {isEdit ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
