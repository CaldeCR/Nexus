import React, { useState, useMemo } from 'react';
import { Icons } from '../layout/NavIcons';

/**
 * Normaliza y agrupa los usuarios registrados en el sistema (Directorio Global + usuario en sesión).
 * Elimina duplicados por nombre y asigna roles claros (Administrador, Colaborador, Proveedor).
 */
export function getSystemCandidates(teamDirectory = [], currentUser = null, filterRole = 'all') {
  const map = new Map();
  const currentName = currentUser?.name?.trim() || 'Jorge';

  // 1. Usuario activo en sesión (siempre presente como "Yo")
  map.set(currentName.toLowerCase(), {
    id: currentUser?.id || 'current-user',
    name: currentName,
    role: currentUser?.role || 'admin',
    isMe: true,
    organization: '',
    label: `${currentName} (Yo)`
  });

  // 2. Miembros registrados en el Directorio Global Centralizado
  if (Array.isArray(teamDirectory)) {
    teamDirectory.forEach((m) => {
      if (m && m.name && m.name.trim()) {
        const trimmed = m.name.trim();
        const key = trimmed.toLowerCase();
        const isMe = key === currentName.toLowerCase();
        const role = m.role === 'vendor' ? 'vendor' : m.role === 'admin' ? 'admin' : 'collaborator';
        const roleText = isMe
          ? 'Yo'
          : role === 'admin'
          ? 'Admin'
          : role === 'vendor'
          ? 'Proveedor'
          : 'Colaborador';

        map.set(key, {
          id: m.id || key,
          name: trimmed,
          role,
          isMe,
          organization: m.organization || '',
          label: `${trimmed} (${roleText})`
        });
      }
    });
  }

  let list = Array.from(map.values());

  if (filterRole === 'admin') {
    list = list.filter((c) => c.role === 'admin' || c.isMe);
  } else if (filterRole === 'vendor') {
    list = list.filter((c) => c.role === 'vendor');
  } else if (filterRole === 'collaborator') {
    list = list.filter((c) => c.role !== 'vendor');
  }

  // Ordenar: "Yo" primero, luego Administradores, luego Colaboradores/Proveedores alfabéticamente
  return list.sort((a, b) => {
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });
}

/**
 * Componente de Lista Desplegable para Asignar Responsables.
 * Resuelve la ambigüedad de nombres manuales con comas, limitando la selección
 * a los usuarios reales registrados en el sistema.
 */
export function AssigneeDropdownPicker({
  selectedAssignees = [],
  onChangeAssignees,
  teamDirectory = [],
  currentUser = null,
  label = 'Responsable / Asignado',
  required = true,
  allowMultiple = true,
  placeholder = '-- Seleccionar de la lista de usuarios --',
  hint = '',
  filterRole = 'all',
  id = 'assignee-select'
}) {
  // Normalizar lista de seleccionados a Array de strings
  const selectedList = useMemo(() => {
    if (Array.isArray(selectedAssignees)) {
      return selectedAssignees.filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof selectedAssignees === 'string' && selectedAssignees.trim()) {
      return selectedAssignees.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [selectedAssignees]);

  // Si ya hay más de 1 responsable, iniciamos automáticamente en modo múltiple
  const [isMultiMode, setIsMultiMode] = useState(() => selectedList.length > 1);

  const candidates = useMemo(
    () => getSystemCandidates(teamDirectory, currentUser, filterRole),
    [teamDirectory, currentUser, filterRole]
  );

  const admins = useMemo(() => candidates.filter((c) => c.role === 'admin' || c.isMe), [candidates]);
  const collaborators = useMemo(
    () => candidates.filter((c) => c.role === 'collaborator' && !c.isMe),
    [candidates]
  );
  const vendors = useMemo(() => candidates.filter((c) => c.role === 'vendor'), [candidates]);

  // Manejar cambio en modo simple (1 solo responsable)
  const handleSingleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_MORE__') {
      setIsMultiMode(true);
      return;
    }
    if (val) {
      onChangeAssignees([val]);
    } else {
      onChangeAssignees([]);
    }
  };

  // Manejar adición de responsable en modo múltiple
  const handleAddMultiple = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (!selectedList.some((s) => s.toLowerCase() === val.toLowerCase())) {
      onChangeAssignees([...selectedList, val]);
    }
    // Resetear el select para que siga listo para otra selección
    e.target.value = '';
  };

  // Manejar eliminación de responsable
  const handleRemove = (nameToRemove) => {
    const next = selectedList.filter((s) => s.toLowerCase() !== nameToRemove.toLowerCase());
    onChangeAssignees(next);
    if (next.length <= 1 && isMultiMode) {
      // Opcional: mantener el modo múltiple o volver a simple si está vacío
    }
  };

  // Icono según tipo de usuario
  const getCandidateIcon = (name) => {
    const found = candidates.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found?.isMe) return <Icons.User />;
    if (found?.role === 'admin') return <Icons.ShieldAdmin />;
    if (found?.role === 'vendor') return <Icons.Vendor />;
    return <Icons.Team />;
  };

  const getCandidateClass = (name) => {
    const found = candidates.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found?.isMe) return 'is-mine';
    if (found?.role === 'admin') return 'is-admin';
    if (found?.role === 'vendor') return 'is-vendor';
    return 'is-team';
  };

  const getCandidateLabel = (name) => {
    const found = candidates.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found ? found.label : name;
  };

  const isMulti = allowMultiple && (isMultiMode || selectedList.length > 1);

  return (
    <div className="ui-assignee-picker-block">
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="ui-drawer-label" htmlFor={id} style={{ margin: 0 }}>
            {label} {required && <span className="ui-drawer-req">*</span>}
          </label>
          {isMulti && selectedList.length > 0 && (
            <span className="assignees-count-badge" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--nexus-teal, #0f766e)' }}>
              {selectedList.length} seleccionado{selectedList.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* MODO MÚLTIPLE: Mostrar chips y dropdown para añadir más */}
      {isMulti ? (
        <div className="ui-assignee-multi-wrapper">
          {/* Pills de usuarios asignados */}
          {selectedList.length > 0 && (
            <div className="selected-assignees-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {selectedList.map((name) => (
                <span
                  key={name}
                  className={`selected-assignee-tag ${getCandidateClass(name)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: getCandidateClass(name) === 'is-mine'
                      ? 'rgba(15, 118, 110, 0.15)'
                      : getCandidateClass(name) === 'is-admin'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : getCandidateClass(name) === 'is-vendor'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(52, 211, 153, 0.15)',
                    color: 'var(--ink-900)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {getCandidateIcon(name)}
                  <span>{getCandidateLabel(name)}</span>
                  <button
                    type="button"
                    className="remove-assignee-btn"
                    onClick={() => handleRemove(name)}
                    title={`Quitar a ${name}`}
                    aria-label={`Quitar a ${name}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'currentColor',
                      cursor: 'pointer',
                      padding: '0 0 0 4px',
                      fontSize: '1rem',
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: 0.7
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Select desplegable para añadir */}
          <select
            id={id}
            className="ui-drawer-select"
            value=""
            onChange={handleAddMultiple}
            style={{ width: '100%' }}
          >
            <option value="" disabled>
              {selectedList.length === 0
                ? '▼ Selecciona un responsable de la lista...'
                : '▼ + Añadir otro responsable del sistema...'}
            </option>
            {admins.length > 0 && (
              <optgroup label="Administradores">
                {admins.map((c) => {
                  const isAssigned = selectedList.some((s) => s.toLowerCase() === c.name.toLowerCase());
                  return (
                    <option key={c.name} value={c.name} disabled={isAssigned}>
                      {c.label} {isAssigned ? '✓ (Asignado)' : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
            {collaborators.length > 0 && (
              <optgroup label="Colaboradores">
                {collaborators.map((c) => {
                  const isAssigned = selectedList.some((s) => s.toLowerCase() === c.name.toLowerCase());
                  return (
                    <option key={c.name} value={c.name} disabled={isAssigned}>
                      {c.name} {isAssigned ? '✓ (Asignado)' : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
            {vendors.length > 0 && (
              <optgroup label="Proveedores / Terceros">
                {vendors.map((c) => {
                  const isAssigned = selectedList.some((s) => s.toLowerCase() === c.name.toLowerCase());
                  return (
                    <option key={c.name} value={c.name} disabled={isAssigned}>
                      {c.name} {c.organization ? `(${c.organization})` : ''} {isAssigned ? '✓ (Asignado)' : ''}
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
        </div>
      ) : (
        /* MODO SIMPLE: 1 solo responsable con opción a expandir */
        <div className="ui-assignee-single-wrapper">
          <select
            id={id}
            className="ui-drawer-select"
            value={selectedList[0] || ''}
            onChange={handleSingleSelectChange}
            required={required}
            style={{ width: '100%' }}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {admins.length > 0 && (
              <optgroup label="Administradores">
                {admins.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            )}
            {collaborators.length > 0 && (
              <optgroup label="Colaboradores">
                {collaborators.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {vendors.length > 0 && (
              <optgroup label="Proveedores / Terceros">
                {vendors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.organization ? `(${c.organization})` : ''}
                  </option>
                ))}
              </optgroup>
            )}
            {allowMultiple && (
              <option value="__ADD_MORE__">
                ➕ Asignar múltiples personas (co-responsables)...
              </option>
            )}
          </select>
        </div>
      )}

      {/* Acciones y Ayuda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
        <span className="ui-drawer-hint" style={{ fontSize: '11px', color: 'var(--ink-500)' }}>
          {hint || 'Selecciona de la lista desplegable los usuarios registrados en el sistema.'}
        </span>
        {allowMultiple && !isMulti && (
          <button
            type="button"
            className="ui-assignee-toggle-link"
            onClick={() => setIsMultiMode(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--nexus-teal, #0f766e)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 0',
              textDecoration: 'underline'
            }}
          >
            + Asignar a más personas
          </button>
        )}
      </div>
    </div>
  );
}
