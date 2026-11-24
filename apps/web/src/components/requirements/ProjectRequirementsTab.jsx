import React, { useState, useMemo } from 'react';
import { Icons } from '../layout/NavIcons';

export const REQUIREMENT_TYPES = {
  functional: { label: 'Funcional', icon: '🧩', color: '#0369a1', bg: '#f0f9ff' },
  technical: { label: 'Técnico', icon: '⚙️', color: '#4338ca', bg: '#eef2ff' },
  security: { label: 'Seguridad', icon: '🛡️', color: '#b91c1c', bg: '#fef2f2' },
  integration: { label: 'Integración', icon: '🔌', color: '#0f766e', bg: '#f0fdfa' },
  regulatory: { label: 'Regulatorio', icon: '⚖️', color: '#b45309', bg: '#fffbeb' },
  other: { label: 'Otro', icon: '📄', color: '#475569', bg: '#f8fafc' }
};

export const REQUIREMENT_PRIORITIES = {
  critical: { label: 'Crítica', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  high: { label: 'Alta', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  medium: { label: 'Media', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  low: { label: 'Baja', color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' }
};

export const REQUIREMENT_STATUSES = {
  proposed: { label: 'Propuesto', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  approved: { label: 'Aprobado', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  in_development: { label: 'En Desarrollo', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  completed: { label: 'Cumplido', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  discarded: { label: 'Descartado', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' }
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function ProjectRequirementsTab({
  project,
  workItems = [],
  todayStr = '',
  currentUser,
  onOpenNewTask,
  onRefreshProjects,
  onRefreshWorkItems
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('functional');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('proposed');
  const [formSource, setFormSource] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Rápido de Conversión a Tarea
  const [convertingReq, setConvertingReq] = useState(null);
  const [convertTitle, setConvertTitle] = useState('');
  const [convertDueDate, setConvertDueDate] = useState('');
  const [convertAssignee, setConvertAssignee] = useState(currentUser?.name || 'Jorge');
  const [isConverting, setIsConverting] = useState(false);

  const token = localStorage.getItem('nexus-token') || '';
  const requirements = useMemo(() => project?.requirements || [], [project]);

  // KPIs
  const kpis = useMemo(() => {
    const total = requirements.length;
    const approved = requirements.filter((r) => r.status === 'approved' || r.status === 'in_development').length;
    const completed = requirements.filter((r) => r.status === 'completed').length;
    const withTasks = requirements.filter((r) => (r.linkedTaskIds && r.linkedTaskIds.length > 0)).length;
    const coverage = total > 0 ? Math.round((withTasks / total) * 100) : 0;
    return { total, approved, completed, withTasks, coverage };
  }, [requirements]);

  // Filtrado
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const mTitle = (req.title || '').toLowerCase().includes(term);
        const mCode = (req.code || '').toLowerCase().includes(term);
        const mDesc = (req.description || '').toLowerCase().includes(term);
        const mSource = (req.source || '').toLowerCase().includes(term);
        if (!mTitle && !mCode && !mDesc && !mSource) return false;
      }
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;
      return true;
    });
  }, [requirements, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingReq(null);
    setFormTitle('');
    setFormType('functional');
    setFormPriority('medium');
    setFormStatus('proposed');
    setFormSource('');
    setFormDesc('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (req) => {
    setEditingReq(req);
    setFormTitle(req.title || '');
    setFormType(req.type || 'functional');
    setFormPriority(req.priority || 'medium');
    setFormStatus(req.status || 'proposed');
    setFormSource(req.source || '');
    setFormDesc(req.description || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('El título del requerimiento es obligatorio.');
      return;
    }
    if (!project?.id) return;

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title: formTitle.trim(),
        type: formType,
        priority: formPriority,
        status: formStatus,
        source: formSource.trim(),
        description: formDesc.trim()
      };

      const url = editingReq
        ? `${API_BASE}/projects/${project.id}/requirements/${editingReq.id}`
        : `${API_BASE}/projects/${project.id}/requirements`;

      const method = editingReq ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar requerimiento');
      }

      setIsModalOpen(false);
      if (onRefreshProjects) await onRefreshProjects();
    } catch (err) {
      setErrorMsg(err.message || 'Error en la solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!window.confirm('¿Estás seguro de eliminar este requerimiento? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/requirements/${reqId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al eliminar');
      }
      if (onRefreshProjects) await onRefreshProjects();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el requerimiento');
    }
  };

  const openConvertModal = (req) => {
    setConvertingReq(req);
    setConvertTitle(`[${req.code}] ${req.title}`);
    setConvertDueDate(project?.targetDate || todayStr || '');
    setConvertAssignee(currentUser?.name || 'Jorge');
  };

  const handleExecuteConversion = async (e) => {
    e.preventDefault();
    if (!convertingReq || !project?.id) return;

    setIsConverting(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/requirements/${convertingReq.id}/convert-to-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: convertTitle.trim(),
          dueDate: convertDueDate,
          assignee: convertAssignee
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al convertir requerimiento');
      }

      setConvertingReq(null);
      if (onRefreshProjects) await onRefreshProjects();
      if (onRefreshWorkItems) await onRefreshWorkItems();
    } catch (err) {
      alert(err.message || 'Error al convertir en tarea');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="project-requirements-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header con KPIs y botón de acción */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        padding: '16px',
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E1E5E6'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5F6B76', fontWeight: 600 }}>
            Total Requerimientos
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#1D2A33' }}>
            {kpis.total}
          </span>
          <span style={{ fontSize: '11.5px', color: '#5F6B76' }}>
            Registrados en el proyecto
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5F6B76', fontWeight: 600 }}>
            Aprobados / En Desarrollo
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7' }}>
            {kpis.approved}
          </span>
          <span style={{ fontSize: '11.5px', color: '#5F6B76' }}>
            Listos o en construcción
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5F6B76', fontWeight: 600 }}>
            Cobertura en Tareas
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#2A6F62' }}>
            {kpis.coverage}%
          </span>
          <span style={{ fontSize: '11.5px', color: '#5F6B76' }}>
            {kpis.withTasks} con tareas creadas
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5F6B76', fontWeight: 600 }}>
            Cumplidos / Verificados
          </span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>
            {kpis.completed}
          </span>
          <span style={{ fontSize: '11.5px', color: '#5F6B76' }}>
            Requerimientos completados
          </span>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Filtros */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap', minWidth: '280px' }}>
          {/* Buscador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #DDE2E4',
            borderRadius: '6px',
            padding: '6px 12px',
            flex: '1 1 200px'
          }}>
            <Icons.Search size={15} color="#5F6B76" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, título, solicitante..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                background: 'transparent'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9AA4AC' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #DDE2E4',
              background: '#FFFFFF',
              fontSize: '12.5px',
              color: '#1D2A33'
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="proposed">Propuesto</option>
            <option value="approved">Aprobado</option>
            <option value="in_development">En desarrollo</option>
            <option value="completed">Cumplido</option>
            <option value="discarded">Descartado</option>
          </select>

          {/* Filtro de Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #DDE2E4',
              background: '#FFFFFF',
              fontSize: '12.5px',
              color: '#1D2A33'
            }}
          >
            <option value="all">Todos los tipos</option>
            <option value="functional">🧩 Funcional</option>
            <option value="technical">⚙️ Técnico</option>
            <option value="security">🛡️ Seguridad</option>
            <option value="integration">🔌 Integración</option>
            <option value="regulatory">⚖️ Regulatorio</option>
            <option value="other">📄 Otro</option>
          </select>

          {/* Filtro de Prioridad */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #DDE2E4',
              background: '#FFFFFF',
              fontSize: '12.5px',
              color: '#1D2A33'
            }}
          >
            <option value="all">Todas las prioridades</option>
            <option value="critical">🔴 Crítica</option>
            <option value="high">🟠 Alta</option>
            <option value="medium">🔵 Media</option>
            <option value="low">⚪ Baja</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="ui-btn ui-btn--primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Icons.Plus size={16} />
          <span>+ Nuevo Requerimiento</span>
        </button>
      </div>

      {/* 3. Lista de Requerimientos */}
      {filteredRequirements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px dashed #DDE2E4'
        }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🎯</span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1D2A33', margin: '0 0 6px 0' }}>
            {requirements.length === 0 ? 'No hay requerimientos en este proyecto' : 'No hay requerimientos con los filtros aplicados'}
          </h3>
          <p style={{ fontSize: '13px', color: '#5F6B76', margin: '0 0 16px 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            {requirements.length === 0
              ? 'Define los requerimientos funcionales, técnicos o de integración del proyecto. Podrás convertirlos directamente en tareas en 1 clic.'
              : 'Prueba ajustando los filtros de estado o el término de búsqueda.'}
          </p>
          {requirements.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="ui-btn ui-btn--primary"
              style={{ margin: '0 auto' }}
            >
              + Registrar Primer Requerimiento
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRequirements.map((req) => {
            const typeMeta = REQUIREMENT_TYPES[req.type] || REQUIREMENT_TYPES.other;
            const prioMeta = REQUIREMENT_PRIORITIES[req.priority] || REQUIREMENT_PRIORITIES.medium;
            const statMeta = REQUIREMENT_STATUSES[req.status] || REQUIREMENT_STATUSES.proposed;

            // Tareas asociadas
            const linkedTasks = workItems.filter(
              (w) => w.requirementId === req.id || (req.linkedTaskIds && req.linkedTaskIds.includes(w.id))
            );

            return (
              <div
                key={req.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E1E5E6',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
                }}
              >
                {/* Fila Superior: Código, Tipo, Prioridad, Estado y Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#0F3446',
                      background: '#E6F0EE',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.02em'
                    }}>
                      {req.code}
                    </span>

                    {/* Tipo */}
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: typeMeta.color,
                      background: typeMeta.bg,
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>

                    {/* Prioridad */}
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: prioMeta.color,
                      background: prioMeta.bg,
                      border: `1px solid ${prioMeta.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Prioridad {prioMeta.label}
                    </span>

                    {/* Estado */}
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: statMeta.color,
                      background: statMeta.bg,
                      border: `1px solid ${statMeta.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      ● {statMeta.label}
                    </span>

                    {req.source && (
                      <span style={{ fontSize: '12px', color: '#5F6B76', marginLeft: '4px' }}>
                        Solicitante: <strong style={{ color: '#1D2A33' }}>{req.source}</strong>
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openConvertModal(req)}
                      className="ui-btn ui-btn--secondary"
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        height: '30px',
                        color: '#2A6F62',
                        borderColor: '#2A6F62',
                        fontWeight: 600
                      }}
                      title="Generar una tarea a partir de este requerimiento"
                    >
                      <span>⚡ Convertir en Tarea</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(req)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #DDE2E4',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#3A4650'
                      }}
                      title="Editar requerimiento"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRequirement(req.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#B91C1C'
                      }}
                      title="Eliminar requerimiento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Título y Descripción */}
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1D2A33' }}>
                    {req.title}
                  </h4>
                  {req.description && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {req.description}
                    </p>
                  )}
                </div>

                {/* Tareas Vinculadas */}
                <div style={{
                  borderTop: '1px solid #F0F2F3',
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#5F6B76', fontWeight: 500 }}>
                    Tareas vinculadas ({linkedTasks.length}):
                  </span>
                  {linkedTasks.length === 0 ? (
                    <span style={{ color: '#9AA4AC', fontStyle: 'italic' }}>
                      Aún no se ha derivado ninguna tarea
                    </span>
                  ) : (
                    linkedTasks.map((t) => {
                      const isDone = t.status === 'done';
                      return (
                        <span
                          key={t.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isDone ? '#F0FDF4' : '#F1F5F9',
                            color: isDone ? '#166534' : '#1E293B',
                            border: `1px solid ${isDone ? '#BBF7D0' : '#CBD5E1'}`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 500
                          }}
                          title={t.title}
                        >
                          <span>{isDone ? '✓' : '●'}</span>
                          <strong>{t.code || t.title.substring(0, 15)}</strong>
                          <span style={{ opacity: 0.8 }}>({isDone ? 'Hecho' : 'En curso'})</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREAR / EDITAR REQUERIMIENTO */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 52, 70, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E1E5E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1D2A33' }}>
                {editingReq ? `Editar Requerimiento (${editingReq.code})` : 'Nuevo Requerimiento de Proyecto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#5F6B76' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRequirement} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#B91C1C', fontSize: '12.5px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Título */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Título del Requerimiento <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Integración de API con Softland o Módulo de Notificaciones"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #DDE2E4',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Fila: Tipo y Prioridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Tipo / Categoría
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="functional">🧩 Funcional</option>
                    <option value="technical">⚙️ Técnico / Arquitectura</option>
                    <option value="security">🛡️ Seguridad & Compliance</option>
                    <option value="integration">🔌 Integración / API</option>
                    <option value="regulatory">⚖️ Regulatorio / Legal</option>
                    <option value="other">📄 Otro</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Prioridad
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="critical">🔴 Crítica (Bloqueante)</option>
                    <option value="high">🟠 Alta</option>
                    <option value="medium">🔵 Media</option>
                    <option value="low">⚪ Baja</option>
                  </select>
                </div>
              </div>

              {/* Fila: Estado y Solicitante */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Estado
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="proposed">Propuesto</option>
                    <option value="approved">Aprobado</option>
                    <option value="in_development">En desarrollo</option>
                    <option value="completed">Cumplido</option>
                    <option value="discarded">Descartado</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Solicitante / Origen (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="Ej. Dirección TI, Contabilidad, Cliente"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Descripción / Criterios de Aceptación */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Detalle / Criterios de Aceptación
                </label>
                <textarea
                  rows={4}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe con precisión qué debe cumplir este requerimiento..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #DDE2E4',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ui-btn ui-btn--secondary"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : (editingReq ? 'Guardar Cambios' : 'Crear Requerimiento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONVERTIR EN TAREA */}
      {convertingReq && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 52, 70, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E1E5E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2A6F62', fontWeight: 700 }}>
                  Derivación a Flujo de Trabajo
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 600, color: '#1D2A33' }}>
                  Convertir en Tarea del Proyecto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertingReq(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#5F6B76' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteConversion} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: '#0369A1'
              }}>
                Esta acción creará una tarea en <strong>{project.name}</strong> vinculada al requerimiento <strong>{convertingReq.code}</strong> y pasará el estado del requerimiento a <em>En Desarrollo</em>.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Título de la Tarea <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #DDE2E4',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={convertAssignee}
                    onChange={(e) => setConvertAssignee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={convertDueDate}
                    onChange={(e) => setConvertDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DDE2E4',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setConvertingReq(null)}
                  className="ui-btn ui-btn--secondary"
                  disabled={isConverting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary"
                  disabled={isConverting}
                >
                  {isConverting ? 'Creando tarea...' : '⚡ Crear Tarea Vinculada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
