import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../ui';
import { AssigneeDropdownPicker } from './AssigneeDropdownPicker';

export function ProjectDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEdit = false,
  currentUser = null,
  teamDirectory = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    space: 'work',
    template: 'kanban',
    targetDate: '',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    role: 'lead',
    status: 'execution',
    admins: currentUser?.name || 'Jorge',
    members: ''
  });

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        space: initialData.space || 'work',
        template: initialData.template || 'kanban',
        targetDate: initialData.targetDate || '',
        startDate: initialData.startDate || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        role: initialData.role || 'lead',
        status: initialData.status || 'execution',
        admins: Array.isArray(initialData.admins) ? initialData.admins.join(', ') : (initialData.admins || currentUser?.name || 'Jorge'),
        members: Array.isArray(initialData.members) ? initialData.members.join(', ') : (initialData.members || '')
      });
    } else {
      setFormData({
        name: '',
        space: 'work',
        template: 'kanban',
        targetDate: '',
        startDate: new Date().toISOString().split('T')[0],
        description: '',
        role: 'lead',
        status: 'execution',
        admins: currentUser?.name || 'Jorge',
        members: ''
      });
    }
  }, [initialData, isOpen, currentUser]);

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

  // 4 campos obligatorios (§7.7): Nombre, Espacio, Metodología, Fecha meta
  const validName = formData.name.trim().length >= 2;
  const validSpace = Boolean(formData.space);
  const validTemplate = Boolean(formData.template);
  const validTargetDate = Boolean(formData.targetDate);

  const completedCount = [validName, validSpace, validTemplate, validTargetDate].filter(Boolean).length;
  const isValid = completedCount === 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      admins: formData.admins ? formData.admins.split(',').map((s) => s.trim()).filter(Boolean) : [currentUser?.name || 'Jorge'],
      members: formData.members ? formData.members.split(',').map((s) => s.trim()).filter(Boolean) : []
    };

    onSubmit(payload);
  };

  return (
    <div className="ui-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
      <aside className="ui-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="ui-drawer-header">
          <div className="ui-drawer-title-group">
            <span className="ui-drawer-eyebrow">Gestión de Proyectos</span>
            <h2 className="ui-drawer-title">{isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
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

        {/* Cuerpo con Scroll */}
        <form id="project-drawer-form" onSubmit={handleSubmit} className="ui-drawer-body">
          {/* Alerta de campos obligatorios */}
          <div className="ui-drawer-notice">
            <span>Completa los <strong>4 campos obligatorios</strong> para registrar el proyecto.</span>
          </div>

          {/* 1. Nombre */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="proj-name">
              1. Nombre del proyecto <span className="ui-drawer-req">*</span>
            </label>
            <input
              id="proj-name"
              ref={firstInputRef}
              type="text"
              className="ui-drawer-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Migración CRM o Arquitectura Core"
              required
            />
          </div>

          {/* 2. Espacio (Segmentado) */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label">
              2. Espacio <span className="ui-drawer-req">*</span>
            </label>
            <div className="ui-segmented-control" role="radiogroup" aria-label="Espacio de trabajo">
              <button
                type="button"
                className={`ui-segmented-btn ${formData.space === 'work' ? 'is-active' : ''}`}
                onClick={() => setFormData({ ...formData, space: 'work' })}
                role="radio"
                aria-checked={formData.space === 'work'}
              >
                🏢 Trabajo
              </button>
              <button
                type="button"
                className={`ui-segmented-btn ${formData.space === 'personal' ? 'is-active' : ''}`}
                onClick={() => setFormData({ ...formData, space: 'personal' })}
                role="radio"
                aria-checked={formData.space === 'personal'}
              >
                👤 Personal
              </button>
            </div>
          </div>

          {/* 3. Metodología */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="proj-template">
              3. Metodología <span className="ui-drawer-req">*</span>
            </label>
            <select
              id="proj-template"
              className="ui-drawer-select"
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              required
            >
              <option value="kanban">Kanban (Flujo continuo)</option>
              <option value="scrum">Scrum (Sprints ágiles)</option>
              <option value="pmi">PMI (Predictivo / Tradicional)</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>

          {/* 4. Fecha meta */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="proj-target-date">
              4. Fecha meta / entrega <span className="ui-drawer-req">*</span>
            </label>
            <input
              id="proj-target-date"
              type="date"
              className="ui-drawer-input"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>

          <div className="ui-drawer-divider" />
          <span className="ui-drawer-section-heading">Detalles Adicionales (Opcionales)</span>

          {/* Fecha de inicio & Rol */}
          <div className="ui-drawer-grid-2">
            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="proj-start-date">Fecha de inicio</label>
              <input
                id="proj-start-date"
                type="date"
                className="ui-drawer-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="ui-drawer-field">
              <label className="ui-drawer-label" htmlFor="proj-role">Mi rol</label>
              <select
                id="proj-role"
                className="ui-drawer-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="lead">Encargado (Líder)</option>
                <option value="collaborator">Colaborador</option>
              </select>
            </div>
          </div>

          {/* Etapa inicial */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="proj-status">Etapa</label>
            <select
              id="proj-status"
              className="ui-drawer-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="preproject">Preproyecto</option>
              <option value="review">En revisión</option>
              <option value="execution">En ejecución</option>
              <option value="completed">Finalizado</option>
              <option value="discarded">Descartado</option>
            </select>
          </div>

          {/* Descripción */}
          <div className="ui-drawer-field">
            <label className="ui-drawer-label" htmlFor="proj-desc">Descripción / Objetivo</label>
            <textarea
              id="proj-desc"
              rows="3"
              className="ui-drawer-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve resumen del alcance o propósito principal..."
            />
          </div>

          {/* Administradores */}
          <div className="ui-drawer-field">
            <AssigneeDropdownPicker
              id="proj-admins"
              label="Administradores del Proyecto"
              required={false}
              allowMultiple={true}
              selectedAssignees={formData.admins}
              onChangeAssignees={(newAdmins) => setFormData({ ...formData, admins: newAdmins.join(', ') })}
              teamDirectory={teamDirectory}
              currentUser={currentUser}
              placeholder="-- Seleccionar Administrador --"
              hint="Usuarios del sistema con permisos de administración sobre este proyecto."
            />
          </div>

          {/* Equipo / Terceros */}
          <div className="ui-drawer-field">
            <AssigneeDropdownPicker
              id="proj-members"
              label="Equipo / Colaboradores / Terceros"
              required={false}
              allowMultiple={true}
              selectedAssignees={formData.members}
              onChangeAssignees={(newMembers) => setFormData({ ...formData, members: newMembers.join(', ') })}
              teamDirectory={teamDirectory}
              currentUser={currentUser}
              placeholder="-- Seleccionar Colaborador o Proveedor --"
              hint="Colaboradores del sistema asignados al equipo de trabajo de este proyecto."
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
              form="project-drawer-form"
              className="ui-btn ui-btn--primary"
              disabled={!isValid}
            >
              {isEdit ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
