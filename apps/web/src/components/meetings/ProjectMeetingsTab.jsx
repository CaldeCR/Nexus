import React, { useState, useMemo } from 'react';
import { Icons } from '../layout/NavIcons';

export function ProjectMeetingsTab({
  project,
  meetings = [],
  workItems = [],
  todayStr = '',
  currentUser,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onCreateTaskFromAction,
  onOpenNewTask
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [copiedMeetingId, setCopiedMeetingId] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(todayStr || new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:00 - 11:00 AM');
  const [formAttendees, setFormAttendees] = useState(
    currentUser?.name ? `${currentUser.name}` : 'Jorge Calderón'
  );
  const [formNotes, setFormNotes] = useState('');
  const [formActionItems, setFormActionItems] = useState([
    { text: '', assignee: currentUser?.name || 'Jorge Calderón', dueDate: todayStr, autoCreateTask: true }
  ]);

  // Filtrar reuniones asociadas a este proyecto
  const projectMeetings = useMemo(() => {
    if (!project) return [];
    return meetings
      .filter((m) => m.projectId === project.id || m.projectCode === project.code)
      .filter((m) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          m.title.toLowerCase().includes(term) ||
          m.notes.toLowerCase().includes(term) ||
          (Array.isArray(m.attendees) && m.attendees.some((a) => a.toLowerCase().includes(term)))
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings, project, searchTerm]);

  // Abre el modal para nueva reunión
  const handleOpenNew = () => {
    setEditingMeeting(null);
    setFormTitle('');
    setFormDate(todayStr || new Date().toISOString().split('T')[0]);
    setFormTime('10:00 - 11:00 AM');
    setFormAttendees(currentUser?.name ? `${currentUser.name}` : 'Jorge Calderón');
    setFormNotes('');
    setFormActionItems([
      { text: '', assignee: currentUser?.name || 'Jorge Calderón', dueDate: todayStr, autoCreateTask: true }
    ]);
    setIsModalOpen(true);
  };

  // Abre el modal para editar reunión
  const handleOpenEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormTitle(meeting.title || '');
    setFormDate(meeting.date || todayStr);
    setFormTime(meeting.time || '');
    setFormAttendees(
      Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : meeting.attendees || ''
    );
    setFormNotes(meeting.notes || '');
    setFormActionItems(
      meeting.actionItems && meeting.actionItems.length > 0
        ? meeting.actionItems.map((a) => ({ ...a, autoCreateTask: !a.createdTaskId }))
        : [{ text: '', assignee: currentUser?.name || 'Jorge Calderón', dueDate: todayStr, autoCreateTask: true }]
    );
    setIsModalOpen(true);
  };

  const handleAddActionRow = () => {
    setFormActionItems([
      ...formActionItems,
      { text: '', assignee: currentUser?.name || 'Jorge Calderón', dueDate: todayStr, autoCreateTask: true }
    ]);
  };

  const handleRemoveActionRow = (idx) => {
    setFormActionItems(formActionItems.filter((_, i) => i !== idx));
  };

  const handleActionChange = (idx, field, val) => {
    const updated = [...formActionItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormActionItems(updated);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const attendeesList = formAttendees
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const validActions = formActionItems
      .filter((a) => a.text.trim().length > 0)
      .map((a, idx) => ({
        id: a.id || `act-${Date.now()}-${idx}`,
        text: a.text.trim(),
        assignee: a.assignee || currentUser?.name || 'Jorge',
        dueDate: a.dueDate || todayStr,
        createdTaskId: a.createdTaskId || null,
        autoCreateTask: a.autoCreateTask
      }));

    if (editingMeeting) {
      const updated = {
        ...editingMeeting,
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        attendees: attendeesList,
        notes: formNotes,
        actionItems: validActions
      };
      if (onUpdateMeeting) onUpdateMeeting(updated);
    } else {
      const newMeeting = {
        id: `meet-${Date.now()}`,
        projectId: project.id,
        projectCode: project.code,
        title: formTitle.trim(),
        date: formDate,
        time: formTime,
        attendees: attendeesList,
        notes: formNotes,
        actionItems: validActions,
        createdAt: new Date().toISOString()
      };
      if (onCreateMeeting) onCreateMeeting(newMeeting);
    }

    setIsModalOpen(false);
  };

  // Copia la minuta formateada para WhatsApp o correo
  const handleCopyMinutes = (meeting) => {
    const attendeesText = Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : meeting.attendees || '';
    let text = `📝 MINUTA DE REUNIÓN — ${project.name}\n`;
    text += `📌 ${meeting.title}\n`;
    text += `📅 Fecha: ${meeting.date} ${meeting.time ? `(${meeting.time})` : ''}\n`;
    text += `👥 Asistentes: ${attendeesText}\n\n`;
    text += `📋 ACUERDOS Y PUNTOS TRATADOS:\n${meeting.notes || 'Sin notas registradas.'}\n\n`;

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      text += `⚡ COMPROMISOS Y ACCIONES:\n`;
      meeting.actionItems.forEach((act, idx) => {
        text += `${idx + 1}. ${act.text} (Resp: ${act.assignee} · Fecha: ${act.dueDate || 'Sin fecha'})\n`;
      });
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMeetingId(meeting.id);
        setTimeout(() => setCopiedMeetingId(null), 2500);
      });
    }
  };

  return (
    <div className="project-meetings-tab-container">
      {/* 1. Header con Buscador y Botón de Nueva Minuta */}
      <div className="project-meetings-header">
        <div className="project-meetings-header-left">
          <div className="project-meetings-search-box">
            <Icons.Search size={14} />
            <input
              type="text"
              className="project-meetings-search-input"
              placeholder="Buscar en minutas, asistentes o acuerdos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar minutas"
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
          <span className="project-meetings-count-text">
            {projectMeetings.length} {projectMeetings.length === 1 ? 'reunión registrada' : 'reuniones registradas'}
          </span>
        </div>

        <button
          type="button"
          className="ui-btn ui-btn--primary ui-btn--small"
          onClick={handleOpenNew}
          title="Registrar una nueva minuta de reunión con acuerdos"
        >
          <Icons.Plus size={16} />
          <span>Nueva Minuta / Reunión</span>
        </button>
      </div>

      {/* 2. Listado de Minutas */}
      {projectMeetings.length === 0 ? (
        <div className="project-meetings-empty">
          <span style={{ fontSize: '32px' }}>📝</span>
          <strong style={{ fontSize: '15px', color: 'var(--ink-900)' }}>
            {searchTerm ? 'No se encontraron minutas con esa búsqueda' : 'Aún no hay reuniones registradas para este proyecto'}
          </strong>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-500)', maxWidth: '440px' }}>
            Registra los acuerdos tomados en sincronizaciones semanales, comités o reuniones con clientes y conviértelos directamente en tareas.
          </p>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--small"
            style={{ marginTop: '8px' }}
            onClick={handleOpenNew}
          >
            <Icons.Plus size={14} />
            <span>Registrar Primera Minuta</span>
          </button>
        </div>
      ) : (
        <div className="project-meetings-timeline">
          {projectMeetings.map((meeting) => {
            const isCopied = copiedMeetingId === meeting.id;
            return (
              <div key={meeting.id} className="project-meeting-card">
                {/* Cabecera de la Minuta */}
                <div className="project-meeting-card-header">
                  <div className="project-meeting-date-badge">
                    <Icons.Calendar size={13} />
                    <span>{meeting.date}</span>
                    {meeting.time && <span style={{ opacity: 0.8 }}>· {meeting.time}</span>}
                  </div>

                  <div className="project-meeting-card-actions">
                    <button
                      type="button"
                      className={`ui-btn ui-btn--secondary ui-btn--small ${isCopied ? 'is-copied' : ''}`}
                      onClick={() => handleCopyMinutes(meeting)}
                      title="Copiar minuta formateada para WhatsApp o correo"
                    >
                      {isCopied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                      <span>{isCopied ? '¡Copiado!' : 'Copiar Minuta'}</span>
                    </button>

                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost ui-btn--small"
                      onClick={() => handleOpenEdit(meeting)}
                      title="Editar minuta"
                      aria-label="Editar minuta"
                    >
                      <Icons.Edit size={14} />
                    </button>

                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost ui-btn--small"
                      onClick={() => onDeleteMeeting && onDeleteMeeting(meeting.id)}
                      title="Eliminar minuta"
                      aria-label="Eliminar minuta"
                      style={{ color: 'var(--danger-600, #9B3B32)' }}
                    >
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                </div>

                {/* Título de la reunión */}
                <h3 className="project-meeting-title">{meeting.title}</h3>

                {/* Asistentes */}
                {Array.isArray(meeting.attendees) && meeting.attendees.length > 0 && (
                  <div className="project-meeting-attendees-row">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-500)' }}>
                      Asistentes:
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {meeting.attendees.map((attendee, i) => (
                        <span key={i} className="project-meeting-attendee-chip">
                          <span className="project-meeting-attendee-dot" />
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Puntos Tratados y Acuerdos Clave */}
                {meeting.notes && (
                  <div className="project-meeting-notes-box">
                    <strong className="project-meeting-box-title">PUNTOS TRATADOS & ACUERDOS</strong>
                    <div className="project-meeting-notes-text">
                      {meeting.notes.split('\n').map((line, idx) => (
                        <p key={idx} style={{ margin: '0 0 4px 0' }}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compromisos y Tareas Generadas */}
                <div className="project-meeting-actions-box">
                  <div className="project-meeting-actions-top">
                    <strong className="project-meeting-box-title">
                      COMPROMISOS Y TAREAS RESULTANTES ({meeting.actionItems?.length || 0})
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--ink-500)' }}>
                      Acciones operativas vinculadas al proyecto
                    </span>
                  </div>

                  {(!meeting.actionItems || meeting.actionItems.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'var(--ink-500)', fontStyle: 'italic', padding: '6px 0' }}>
                      No se registraron compromisos específicos en esta reunión.
                    </div>
                  ) : (
                    <div className="project-meeting-actions-list">
                      {meeting.actionItems.map((act) => {
                        const hasCreatedTask =
                          Boolean(act.createdTaskId) ||
                          workItems.some(
                            (w) =>
                              w.id === act.createdTaskId ||
                              (w.title === act.text &&
                                (w.projectId === project?.id || w.projectId === meeting.projectId))
                          );
                        const isOverdue = act.dueDate && todayStr && act.dueDate < todayStr && !hasCreatedTask;

                        return (
                          <div key={act.id} className="project-meeting-action-item">
                            <span className="project-meeting-action-bullet">⚡</span>

                            <div className="project-meeting-action-text-col">
                              <span className="project-meeting-action-title">{act.text}</span>
                              <div className="project-meeting-action-meta">
                                <span className="project-meeting-action-assignee">
                                  👤 {act.assignee}
                                </span>
                                {act.dueDate && (
                                  <span className={`project-meeting-action-date ${isOverdue ? 'is-late' : ''}`}>
                                    📅 {isOverdue ? `⚠️ ${act.dueDate} (Vencido)` : act.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Estado / Botón de Acción */}
                            <div className="project-meeting-action-right">
                              {hasCreatedTask ? (
                                <span className="project-action-task-badge is-linked" title="Esta tarea ya está integrada al proyecto">
                                  ✓ Tarea en Proyecto
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="project-action-convert-btn"
                                  onClick={() => onCreateTaskFromAction && onCreateTaskFromAction(project, act, meeting)}
                                  title="Crear tarea formal en este proyecto a partir de este compromiso"
                                >
                                  + Convertir a Tarea
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal de Creación / Edición de Minuta */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-meeting-title"
        >
          <div
            className="modal-card modal-card--meeting"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="meeting-modal-header">
              <div className="meeting-modal-header-left">
                <div className="meeting-modal-icon-badge">
                  <Icons.FileText size={20} />
                </div>
                <div>
                  <h3 id="modal-meeting-title" className="meeting-modal-title">
                    {editingMeeting ? 'Editar Minuta de Reunión' : 'Registrar Minuta de Reunión'}
                  </h3>
                  <p className="meeting-modal-subtitle">
                    Acuerdos, notas y compromisos convertibles en tareas del proyecto
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
                title="Cerrar"
                style={{ position: 'static' }}
              >
                <Icons.Close size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="meeting-modal-form">
              {/* Título de la reunión */}
              <div className="meeting-form-field">
                <label>Título o Asunto de la Reunión *</label>
                <input
                  type="text"
                  className="meeting-form-input"
                  placeholder="ej. Sincronización semanal con TrueSec, Comité de avance..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Fila Fecha y Horario */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="meeting-form-field">
                  <label>Fecha de la Reunión</label>
                  <input
                    type="date"
                    className="meeting-form-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <div className="meeting-form-field">
                  <label>Horario o Duración</label>
                  <input
                    type="text"
                    className="meeting-form-input"
                    placeholder="ej. 10:00 - 11:00 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Asistentes */}
              <div className="meeting-form-field">
                <label>Asistentes / Participantes (separados por coma)</label>
                <input
                  type="text"
                  className="meeting-form-input"
                  placeholder="ej. Jorge Calderón, Jean Paul, Esteban Montoya, Auditor TrueSec"
                  value={formAttendees}
                  onChange={(e) => setFormAttendees(e.target.value)}
                />
              </div>

              {/* Puntos Tratados */}
              <div className="meeting-form-field">
                <label>Acuerdos, Puntos Tratados y Notas Clave</label>
                <textarea
                  className="meeting-form-textarea"
                  rows={4}
                  placeholder="• Escribe aquí los puntos principales acordados...&#10;• Decisiones técnicas o de alcance tomadas...&#10;• Próxima fecha de revisión acordada..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Compromisos y Tareas generadas */}
              <div className="meeting-commitments-card">
                <div className="meeting-commitments-header">
                  <span className="meeting-commitments-title">
                    <span style={{ color: '#E57A00' }}>⚡</span>
                    <span>Compromisos / Tareas resultantes de esta reunión</span>
                  </span>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--small"
                    onClick={handleAddActionRow}
                    style={{ fontSize: '11px', padding: '3px 9px', height: '28px' }}
                  >
                    + Agregar compromiso
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formActionItems.map((act, idx) => (
                    <div key={idx} className="meeting-commitment-row">
                      <input
                        type="text"
                        className="meeting-form-input"
                        style={{ fontSize: '12px', padding: '7px 9px' }}
                        placeholder="Descripción del compromiso o tarea..."
                        value={act.text}
                        onChange={(e) => handleActionChange(idx, 'text', e.target.value)}
                      />
                      <input
                        type="text"
                        className="meeting-form-input"
                        style={{ fontSize: '12px', padding: '7px 9px' }}
                        placeholder="Responsable"
                        value={act.assignee}
                        onChange={(e) => handleActionChange(idx, 'assignee', e.target.value)}
                      />
                      <input
                        type="date"
                        className="meeting-form-input"
                        style={{ fontSize: '12px', padding: '7px 9px' }}
                        value={act.dueDate}
                        onChange={(e) => handleActionChange(idx, 'dueDate', e.target.value)}
                      />
                      <button
                        type="button"
                        className="meeting-commitment-delete-btn"
                        onClick={() => handleRemoveActionRow(idx)}
                        title="Eliminar fila"
                        aria-label="Eliminar fila"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <span style={{ fontSize: '11px', color: 'var(--ink-500)', display: 'block', marginTop: '4px' }}>
                  ✓ Los compromisos se registrarán en la minuta y podrás convertirlos en tareas activas del proyecto en 1 clic.
                </span>
              </div>

              <div className="meeting-modal-footer">
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary"
                >
                  {editingMeeting ? 'Guardar Cambios' : 'Registrar Minuta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
