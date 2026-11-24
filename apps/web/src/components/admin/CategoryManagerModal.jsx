import React, { useState, useEffect } from 'react';
import { Icons } from '../layout/NavIcons';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const EMOJI_PRESETS = ['💻', '⚙️', '🔀', '☁️', '🛠️', '📦', '🛡️', '🚀', '📊', '📱', '🌐', '🔒', '💡', '📈', '🔬'];

const COLOR_PRESETS = [
  { name: 'Azul Cielo', color: '#0284c7' },
  { name: 'Púrpura', color: '#7c3aed' },
  { name: 'Azul Real', color: '#2563eb' },
  { name: 'Cian', color: '#0891b2' },
  { name: 'Ámbar', color: '#d97706' },
  { name: 'Verde', color: '#16a34a' },
  { name: 'Rosa / Rojo', color: '#e11d48' },
  { name: 'Pizarra', color: '#64748b' }
];

export function CategoryManagerModal({
  isOpen,
  onClose,
  currentUser,
  onCategoriesChanged
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sub-modal Crear / Editar
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('💻');
  const [formColor, setFormColor] = useState('#0284c7');
  const [formDesc, setFormDesc] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sub-modal Reasignar / Eliminar
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [sourceCategory, setSourceCategory] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [isAndThenDelete, setIsAndThenDelete] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const token = localStorage.getItem('nexus-token') || '';

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
      setCategories(data.items || []);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormIcon('💻');
    setFormColor('#0284c7');
    setFormDesc('');
    setFormIsDefault(false);
    setIsEditorOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormIcon(cat.icon || '📁');
    setFormColor(cat.color || '#0284c7');
    setFormDesc(cat.description || '');
    setFormIsDefault(Boolean(cat.isDefault));
    setIsEditorOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formName.trim(),
        icon: formIcon,
        color: formColor,
        bgColor: `${formColor}15`,
        description: formDesc.trim(),
        isDefault: formIsDefault
      };

      const url = editingCategory
        ? `${API_BASE}/categories/${editingCategory.id}`
        : `${API_BASE}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error al guardar la categoría');

      setIsEditorOpen(false);
      setSuccessMsg(`Categoría "${formName}" guardada correctamente.`);
      await fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Error en la operación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (cat) => {
    setErrorMsg('');
    setSuccessMsg('');

    // Si tiene proyectos vinculados, abrimos el modal de regla de integridad (reasignación forzosa)
    if (cat.projectCount > 0) {
      setSourceCategory(cat);
      setIsAndThenDelete(true);
      const otherCats = categories.filter((c) => c.id !== cat.id);
      setTargetCategoryId(otherCats[0]?.id || '');
      setReassignModalOpen(true);
      return;
    }

    // Si tiene 0 proyectos, confirmación directa
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'No se pudo eliminar');

      setSuccessMsg(`Categoría "${cat.name}" eliminada.`);
      await fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar');
    }
  };

  const openReassignModal = (cat) => {
    setSourceCategory(cat);
    setIsAndThenDelete(false);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setTargetCategoryId(otherCats[0]?.id || '');
    setReassignModalOpen(true);
  };

  const handleExecuteReassignment = async (e) => {
    e.preventDefault();
    if (!sourceCategory || !targetCategoryId) return;

    setIsReassigning(true);
    setErrorMsg('');

    try {
      const url = isAndThenDelete
        ? `${API_BASE}/categories/${sourceCategory.id}/reassign-and-delete`
        : `${API_BASE}/categories/reassign-projects`;

      const body = isAndThenDelete
        ? { targetCategoryId }
        : { sourceCategoryId: sourceCategory.id, targetCategoryId };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error en la reasignación');

      setReassignModalOpen(false);
      setSuccessMsg(data.message || 'Proyectos reasignados exitosamente.');
      await fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Error al reasignar proyectos');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 52, 70, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E1E5E6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFB'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1D2A33' }}>
                CMS de Catálogos · Tipologías de Proyecto
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#5F6B76' }}>
              Configura las naturalezas de proyectos, iconos y colores. Se aplican reglas de integridad referencial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#5F6B76',
              padding: '6px'
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Mensajes de Feedback */}
        {errorMsg && (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#B91C1C',
            fontSize: '13px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '10px 14px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '13px'
          }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Barra de Acciones Superior */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F0F2F3'
        }}>
          <span style={{ fontSize: '13px', color: '#5F6B76' }}>
            Total de categorías registradas: <strong>{categories.length}</strong>
          </span>

          <button
            type="button"
            onClick={openCreateModal}
            className="ui-btn ui-btn--primary"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            <Icons.Plus size={16} />
            <span>+ Nueva Categoría</span>
          </button>
        </div>

        {/* Cuerpo de la Lista de Categorías */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#5F6B76' }}>
              Cargando catálogo...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#5F6B76' }}>
              No hay categorías definidas.
            </div>
          ) : (
            categories.map((cat) => {
              const count = cat.projectCount || 0;
              return (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '1px solid #E1E5E6',
                    background: '#FFFFFF',
                    gap: '16px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* Icono + Nombre + Descripción */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: cat.bgColor || `${cat.color}15`,
                      border: `1px solid ${cat.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0
                    }}>
                      {cat.icon || '📁'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#1D2A33' }}>
                          {cat.name}
                        </strong>
                        {cat.isDefault && (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: '#0284c7',
                            background: '#F0F9FF',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Por defecto
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <span style={{ fontSize: '12px', color: '#5F6B76' }}>
                          {cat.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contador de Proyectos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: count > 0 ? '#E6F0EE' : '#F1F5F9',
                        color: count > 0 ? '#0F3446' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title={cat.projectNames?.length ? `Proyectos: ${cat.projectNames.join(', ')}` : 'Sin proyectos'}
                    >
                      <span>📊</span>
                      <span>{count} {count === 1 ? 'proyecto' : 'proyectos'}</span>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="ui-btn ui-btn--ghost ui-btn--small"
                        style={{ padding: '6px 10px', fontSize: '12px', color: '#1D2A33' }}
                        title="Editar nombre, color o icono"
                      >
                        ✏️ Editar
                      </button>

                      {count > 0 && (
                        <button
                          type="button"
                          onClick={() => openReassignModal(cat)}
                          className="ui-btn ui-btn--secondary ui-btn--small"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#2563EB', borderColor: '#BFDBFE' }}
                          title="Reasignar proyectos a otra categoría"
                        >
                          🔀 Reasignar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(cat)}
                        className="ui-btn ui-btn--ghost ui-btn--small"
                        style={{ padding: '6px 8px', fontSize: '12px', color: '#DC2626' }}
                        title={count > 0 ? 'Esta categoría tiene proyectos. Clic para reasignar y eliminar.' : 'Eliminar categoría'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #E1E5E6',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#F8FAFB'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="ui-btn ui-btn--secondary"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* SUB-MODAL: CREAR / EDITAR CATEGORÍA */}
      {isEditorOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100005,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
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
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Proyecto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#5F6B76' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Nombre de la Categoría <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Ciberseguridad o Auditoría TI"
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

              {/* Selector de Ícono Emoji */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '6px' }}>
                  Ícono Representativo
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      style={{
                        width: '34px',
                        height: '34px',
                        fontSize: '18px',
                        borderRadius: '6px',
                        border: formIcon === emoji ? '2px solid #0284c7' : '1px solid #DDE2E4',
                        background: formIcon === emoji ? '#F0F9FF' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Color */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '6px' }}>
                  Color Temático
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setFormColor(p.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: p.color,
                        border: formColor === p.color ? '3px solid #1D2A33' : '2px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        cursor: 'pointer'
                      }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Breve propósito o alcance de esta tipología..."
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

              {/* Marcar por defecto */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#1D2A33' }}>
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                />
                <span>Establecer como categoría predeterminada al crear nuevos proyectos</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
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
                  {isSaving ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : 'Crear Categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: REASIGNACIÓN Y PROTECCIÓN DE INTEGRIDAD */}
      {reassignModalOpen && sourceCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100005,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E1E5E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isAndThenDelete ? '#FEF2F2' : '#F8FAFB'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: isAndThenDelete ? '#B91C1C' : '#2563EB', fontWeight: 700 }}>
                  {isAndThenDelete ? '⚠️ Regla de Integridad Referencial' : 'Migración de Proyectos'}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 600, color: '#1D2A33' }}>
                  {isAndThenDelete ? 'Reasignar Proyectos para Eliminar' : 'Reasignar Proyectos a Otra Categoría'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#5F6B76' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReassignment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: isAndThenDelete ? '#FFF5F5' : '#EFF6FF',
                border: `1px solid ${isAndThenDelete ? '#FECACA' : '#BFDBFE'}`,
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: isAndThenDelete ? '#991B1B' : '#1E40AF',
                lineHeight: 1.5
              }}>
                {isAndThenDelete ? (
                  <>
                    La categoría <strong>{sourceCategory.name}</strong> está asociada a <strong>{sourceCategory.projectCount} proyecto(s)</strong>.
                    Para garantizar la trazabilidad, debes elegir una nueva categoría a la cual transferirlos antes de eliminarla.
                  </>
                ) : (
                  <>
                    Se transferirán los <strong>{sourceCategory.projectCount} proyecto(s)</strong> vinculados a <strong>{sourceCategory.name}</strong> hacia la categoría que elijas a continuación.
                  </>
                )}
              </div>

              {sourceCategory.projectNames?.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#5F6B76', marginBottom: '4px' }}>
                    Proyectos afectados:
                  </label>
                  <div style={{
                    maxHeight: '100px',
                    overflowY: 'auto',
                    background: '#F8FAFB',
                    border: '1px solid #E1E5E6',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#1D2A33'
                  }}>
                    {sourceCategory.projectNames.map((name, i) => (
                      <div key={i} style={{ padding: '2px 0' }}>• {name}</div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1D2A33', marginBottom: '4px' }}>
                  Seleccionar Categoría de Destino <span style={{ color: '#B91C1C' }}>*</span>
                </label>
                <select
                  required
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #DDE2E4',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {categories
                    .filter((c) => c.id !== sourceCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="ui-btn ui-btn--secondary"
                  disabled={isReassigning}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn--primary"
                  style={{
                    background: isAndThenDelete ? '#DC2626' : undefined,
                    borderColor: isAndThenDelete ? '#DC2626' : undefined
                  }}
                  disabled={isReassigning || !targetCategoryId}
                >
                  {isReassigning
                    ? 'Procesando...'
                    : (isAndThenDelete ? 'Reasignar y Eliminar Categoría' : 'Reasignar Proyectos')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
