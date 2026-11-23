import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';

export function ImportExcelModal({
  isOpen,
  onClose,
  projects = [],
  selectedProjectId = null,
  currentUser = null,
  onImportComplete
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parsedPhases, setParsedPhases] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  // Target mode: 'existing' | 'new'
  const [targetMode, setTargetMode] = useState('existing');
  const [targetProjectId, setTargetProjectId] = useState(selectedProjectId || (projects[0]?.id || ''));
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSpace, setNewProjectSpace] = useState('work');
  const [autoCreatePhases, setAutoCreatePhases] = useState(true);

  const fileInputRef = useRef(null);

  // Reset or update default project when opening or selection changes
  React.useEffect(() => {
    if (selectedProjectId) {
      setTargetProjectId(selectedProjectId);
    } else if (projects.length > 0 && !targetProjectId) {
      setTargetProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  if (!isOpen) return null;

  // 1. Descargar plantilla oficial
  const handleDownloadTemplate = (format = 'xlsx') => {
    const headers = [
      'ID',
      'Fase',
      'Tarea / hito',
      'Estado',
      'Responsable',
      'Prioridad',
      'Tipo',
      'Fecha Inicio',
      'Fecha Fin',
      'Cierre (multifase)',
      'Origen',
      'Notas'
    ];

    const sampleRows = [
      [
        'F0-01',
        'Fase 0',
        'Landing page con información general de paquetes y servicios',
        'Completada',
        'Sebastián Cubillos',
        'Alta',
        'task',
        '2026-10-26',
        '2026-11-04',
        '',
        'Definida',
        'Alojada en el servidor web del proyecto.'
      ],
      [
        'MF-01',
        'Multifase',
        'Registro manual en Zoho de contactos por otros medios (redes sociales)',
        'En curso',
        'PVE',
        'Alta',
        'task',
        '2026-11-04',
        '',
        'Fase 3',
        'Definida',
        'Arrancó en Fase 0. Termina al automatizar redes sociales.'
      ],
      [
        'F1-01',
        'Fase 1',
        'Diseño de Oportunidades (9 fases, 29 campos)',
        'Completada',
        'TI',
        'Alta',
        'task',
        '2026-11-04',
        '2026-11-11',
        '',
        'Definida',
        'En producción.'
      ],
      [
        'F1-02',
        'Fase 1',
        'Cotizaciones en Presupuestos: plantilla PDF con logo',
        'En curso',
        'TI',
        'Media',
        'task',
        '2026-11-12',
        '2026-11-30',
        '',
        'Nueva',
        'Tanda 1 de implementación.'
      ],
      [
        'F2-01',
        'Fase 2',
        'Integrar Zoho CRM con Outlook (correos entrantes y salientes)',
        'Pendiente',
        'TI',
        'Media',
        'task',
        '2026-12-01',
        '2026-12-31',
        '',
        'Definida',
        'Requiere permisos de administrador en Office 365.'
      ]
    ];

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...sampleRows.map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Plantilla_Importacion_Nexus.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // XLSX format
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 14 }, // Fase
      { wch: 45 }, // Tarea / hito
      { wch: 14 }, // Estado
      { wch: 22 }, // Responsable
      { wch: 12 }, // Prioridad
      { wch: 10 }, // Tipo
      { wch: 14 }, // Inicio
      { wch: 14 }, // Fin
      { wch: 18 }, // Cierre multifase
      { wch: 14 }, // Origen
      { wch: 45 }  // Notas
    ];

    // Instrucciones
    const guideData = [
      ['GUÍA DE LLENADO DE PLANTILLA NEXUS'],
      [''],
      ['Columna', 'Descripción', 'Valores permitidos / Ejemplos'],
      ['ID', 'Identificador de la tarea (opcional)', 'F1-01, MF-01, o vacío para autogenerar'],
      ['Fase', 'Nombre o número de la fase', 'Fase 0, Fase 1, Fase 2, o "Multifase"'],
      ['Tarea / hito', 'Título de la tarea o hito (Obligatorio)', 'Texto descriptivo de la acción'],
      ['Estado', 'Estado de avance', 'Completada | En curso | Validación | Pendiente | En pausa'],
      ['Responsable', 'Persona o equipo a cargo', 'Jorge, Sebastián Cubillos, TI, Asesores'],
      ['Prioridad', 'Nivel de urgencia o impacto', 'Alta | Media | Baja'],
      ['Tipo', 'Tipo de elemento', 'task (tarea regular) | milestone (hito)'],
      ['Fecha Inicio', 'Fecha en formato AAAA-MM-DD', '2026-11-04'],
      ['Fecha Fin', 'Fecha límite en formato AAAA-MM-DD', '2026-11-30'],
      ['Cierre (multifase)', 'Para tareas que abarcan varias fases', 'Fase 3 (indica en qué fase concluye)'],
      ['Origen', 'Fuente de la tarea (opcional)', 'Definida | Nueva | Sugerida'],
      ['Notas', 'Detalles, avances o bitácora', 'Texto libre con observaciones o progreso']
    ];
    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide['!cols'] = [{ wch: 20 }, { wch: 38 }, { wch: 48 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Tareas');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Instrucciones');
    XLSX.writeFile(wb, 'Plantilla_Importacion_Nexus.xlsx');
  };

  // Helper para normalizar encabezados
  const normalizeKey = (key) => {
    return String(key || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Normalizar fechas de Excel o strings
  const parseDateValue = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial date to YYYY-MM-DD
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // DD/MM/YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  // Normalizar Estado
  const parseStatus = (statusStr) => {
    const s = String(statusStr || '').toLowerCase();
    if (s.includes('complet') || s.includes('hecho') || s.includes('finaliz') || s === 'done') return 'done';
    if (s.includes('curso') || s.includes('progres') || s.includes('activo') || s === 'in_progress') return 'in_progress';
    if (s.includes('validac') || s.includes('revis') || s.includes('pausa') || s === 'review') return 'review';
    return 'backlog';
  };

  // 2. Procesar archivo subido
  const handleProcessFile = (selectedFile) => {
    if (!selectedFile) return;
    setParseError('');
    setImportSuccess(null);
    setFileName(selectedFile.name);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setParseError('El archivo parece estar vacío o no contiene filas legibles.');
          setParsedRows([]);
          return;
        }

        // Inspeccionar cabeceras
        const sampleRow = rawJson[0];
        const keyMap = {};
        Object.keys(sampleRow).forEach((origKey) => {
          const norm = normalizeKey(origKey);
          if (norm.includes('tarea') || norm.includes('hito') || norm.includes('titulo') || norm.includes('actividad') || norm.includes('nombre')) {
            keyMap.title = origKey;
          } else if (norm.includes('fase') || norm.includes('etapa')) {
            keyMap.fase = origKey;
          } else if (norm === 'id' || norm.includes('codigo')) {
            keyMap.id = origKey;
          } else if (norm.includes('estado') || norm.includes('estatus') || norm.includes('status')) {
            keyMap.status = origKey;
          } else if (norm.includes('resp') || norm.includes('asignad') || norm.includes('encargad')) {
            keyMap.resp = origKey;
          } else if (norm.includes('priorid')) {
            keyMap.priority = origKey;
          } else if (norm.includes('tipo')) {
            keyMap.type = origKey;
          } else if (norm.includes('inicio') || norm.includes('start')) {
            keyMap.startDate = origKey;
          } else if (norm.includes('fin') || norm.includes('limite') || norm.includes('entrega') || norm.includes('due') || norm.includes('vencim')) {
            keyMap.dueDate = origKey;
          } else if (norm.includes('cierre') || norm.includes('multifase')) {
            keyMap.cierreMultifase = origKey;
          } else if (norm.includes('origen') || norm.includes('fuente')) {
            keyMap.origen = origKey;
          } else if (norm.includes('nota') || norm.includes('descrip') || norm.includes('observac')) {
            keyMap.notas = origKey;
          }
        });

        if (!keyMap.title) {
          // Intentar la primera columna con texto largo
          const firstCol = Object.keys(sampleRow)[0];
          keyMap.title = firstCol;
        }

        // Extraer tareas estructuradas y fases detectadas
        const detectedPhasesSet = new Set();
        const items = [];

        rawJson.forEach((row, idx) => {
          const rawTitle = row[keyMap.title];
          if (!rawTitle || String(rawTitle).trim() === '') return;

          const rawId = row[keyMap.id] ? String(row[keyMap.id]).trim() : `T-${idx + 1}`;
          const rawFase = row[keyMap.fase] ? String(row[keyMap.fase]).trim() : '';
          const rawStatus = row[keyMap.status] ? String(row[keyMap.status]).trim() : 'Pendiente';
          const rawResp = row[keyMap.resp] ? String(row[keyMap.resp]).trim() : 'Jorge';
          const rawPriority = row[keyMap.priority] ? String(row[keyMap.priority]).trim() : 'Media';
          const rawType = row[keyMap.type] ? String(row[keyMap.type]).trim() : '';
          const rawStartDate = parseDateValue(row[keyMap.startDate]);
          const rawDueDate = parseDateValue(row[keyMap.dueDate]);
          const rawCierre = row[keyMap.cierreMultifase] ? String(row[keyMap.cierreMultifase]).trim() : '';
          const rawOrigen = row[keyMap.origen] ? String(row[keyMap.origen]).trim() : '';
          const rawNotas = row[keyMap.notas] ? String(row[keyMap.notas]).trim() : '';

          if (rawFase && rawFase.toLowerCase() !== 'multifase') {
            detectedPhasesSet.add(rawFase);
          }
          if (rawCierre && rawCierre.toLowerCase() !== 'por confirmar') {
            detectedPhasesSet.add(rawCierre);
          }

          items.push({
            tempId: `row-${idx}`,
            id: rawId,
            fase: rawFase,
            title: String(rawTitle).trim(),
            status: parseStatus(rawStatus),
            rawStatus: rawStatus,
            resp: rawResp,
            priority: rawPriority.toLowerCase().includes('alta') ? 'high' : (rawPriority.toLowerCase().includes('baja') ? 'low' : 'medium'),
            type: rawType ? (rawType.toLowerCase().includes('hito') || rawType.toLowerCase().includes('milestone') ? 'milestone' : 'task') : (String(rawTitle).toLowerCase().startsWith('hito') ? 'milestone' : 'task'),
            startDate: rawStartDate,
            dueDate: rawDueDate,
            cierreMultifase: rawCierre,
            origen: rawOrigen,
            notas: rawNotas
          });
        });

        if (items.length === 0) {
          setParseError('No se encontraron filas con tareas válidas en la hoja analizada.');
          setParsedRows([]);
          return;
        }

        // Construir listado ordenado de fases
        const sortedPhases = Array.from(detectedPhasesSet).sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''), 10);
          const numB = parseInt(b.replace(/\D/g, ''), 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });

        setParsedPhases(sortedPhases);
        setParsedRows(items);
      } catch (err) {
        console.error('Error parseando archivo:', err);
        setParseError(`Error al leer el archivo: ${err.message || 'Formato no soportado'}`);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Mapeo dinámico de fases a IDs
  const resolvePhaseIds = (row, phaseMap) => {
    if (!row.fase) return [];
    if (row.fase.toLowerCase() === 'multifase') {
      const allPhaseKeys = Object.keys(phaseMap);
      if (allPhaseKeys.length === 0) return [];
      
      let endIdx = allPhaseKeys.length - 1;
      if (row.cierreMultifase && phaseMap[row.cierreMultifase.toLowerCase()]) {
        const foundIdx = allPhaseKeys.findIndex(k => k === row.cierreMultifase.toLowerCase());
        if (foundIdx >= 0) endIdx = foundIdx;
      }
      return allPhaseKeys.slice(0, endIdx + 1).map(k => phaseMap[k]);
    }
    const mapped = phaseMap[row.fase.toLowerCase()];
    return mapped ? [mapped] : [];
  };

  // 3. Confirmar e Importar
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setParseError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001/api';
      const token = localStorage.getItem('nexus_auth_token') || '';

      let activeTargetProjectId = targetProjectId;
      let targetProjectObj = projects.find(p => p.id === activeTargetProjectId);

      // Si se crea un nuevo proyecto
      if (targetMode === 'new') {
        if (!newProjectName.trim()) {
          throw new Error('Debes escribir un nombre para el nuevo proyecto');
        }

        const projectPhases = parsedPhases.map((phaseName, idx) => ({
          id: `phase-${idx}`,
          name: phaseName,
          startDate: parsedRows[0]?.startDate || new Date().toISOString().split('T')[0],
          targetDate: parsedRows[parsedRows.length - 1]?.dueDate || '',
          status: idx === 0 ? 'in_progress' : 'pending',
          order: idx
        }));

        const createRes = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newProjectName.trim(),
            space: newProjectSpace,
            template: 'kanban',
            status: 'execution',
            role: 'lead',
            hasPhases: projectPhases.length > 0,
            phases: projectPhases,
            startDate: parsedRows[0]?.startDate || new Date().toISOString().split('T')[0],
            targetDate: parsedRows[parsedRows.length - 1]?.dueDate || ''
          })
        });

        const newProjData = await createRes.json();
        if (!createRes.ok) throw new Error(newProjData.message || 'Error creando el proyecto');
        activeTargetProjectId = newProjData.id;
        targetProjectObj = newProjData;
      }

      if (!activeTargetProjectId) {
        throw new Error('Selecciona o crea un proyecto de destino');
      }

      // Preparar mapeo de fases
      const phaseMap = {};
      const newPhasesToRegister = [];

      const existingPhases = Array.isArray(targetProjectObj?.phases) ? targetProjectObj.phases : [];
      existingPhases.forEach(p => {
        phaseMap[p.name.toLowerCase().trim()] = p.id;
      });

      parsedPhases.forEach((pName, idx) => {
        const norm = pName.toLowerCase().trim();
        if (!phaseMap[norm]) {
          const generatedId = `phase-${existingPhases.length + idx}`;
          phaseMap[norm] = generatedId;
          newPhasesToRegister.push({
            id: generatedId,
            name: pName,
            status: idx === 0 ? 'in_progress' : 'pending'
          });
        }
      });

      // Transformar filas en items listos para batch
      const itemsToImport = parsedRows.map((r, idx) => {
        const phaseIds = resolvePhaseIds(r, phaseMap);
        let description = '';
        if (r.origen) description += `Origen: ${r.origen}. `;
        if (r.notas) description += `${r.notas}`;
        if (r.cierreMultifase) description += ` (Cierre multifase: ${r.cierreMultifase})`;

        const assignees = r.resp ? r.resp.split(/[\/,]/).map(s => s.trim()).filter(Boolean) : ['Jorge'];

        return {
          id: r.id ? `wi-${r.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined,
          code: r.id || undefined,
          title: r.title,
          description: description.trim(),
          type: r.type,
          status: r.status,
          priority: r.priority,
          assignee: r.resp || 'Jorge',
          assignees: assignees,
          startDate: r.startDate || '',
          dueDate: r.dueDate || '',
          phaseIds: phaseIds
        };
      });

      const batchRes = await fetch(`${API_BASE}/work-items/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: activeTargetProjectId,
          items: itemsToImport,
          newPhases: autoCreatePhases ? newPhasesToRegister : []
        })
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok) throw new Error(batchData.message || 'Error importando tareas');

      setImportSuccess({
        count: batchData.count || itemsToImport.length,
        projectName: targetProjectObj?.name || newProjectName,
        projectId: activeTargetProjectId
      });

      if (onImportComplete) {
        onImportComplete(activeTargetProjectId, batchData);
      }
    } catch (err) {
      console.error('Error importando:', err);
      setParseError(err.message || 'Error al procesar la importación');
    } finally {
      setLoading(false);
    }
  };

  const statusBadges = {
    done: { label: 'Completada', bg: 'var(--nexus-green-50, #E8F5E9)', color: '#4C8A45' },
    in_progress: { label: 'En curso', bg: 'var(--nexus-teal-50, #E6F0EE)', color: '#2A6F62' },
    review: { label: 'Validación', bg: '#FFF8E1', color: '#B98A1E' },
    backlog: { label: 'Pendiente', bg: 'var(--surface-muted, #EDF0F0)', color: '#5F6B76' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#2A6F62',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
                Importar Tareas y Proyectos desde Excel / CSV
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                Carga masiva con soporte para fases, multifase, fechas y responsables
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 0,
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              lineHeight: 1
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {importSuccess ? (
            <div
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#15803D', margin: 0 }}>
                ¡Importación Exitosa!
              </h3>
              <p style={{ fontSize: '14px', color: '#166534', margin: 0, maxWidth: '500px' }}>
                Se han importado exitosamente <strong>{importSuccess.count} tareas</strong> en el proyecto <strong>"{importSuccess.projectName}"</strong> con todas sus fases y estados configurados.
              </p>
              <button
                type="button"
                className="ui-btn ui-btn--primary"
                onClick={onClose}
                style={{ marginTop: '8px', padding: '10px 24px' }}
              >
                Listo, ver proyecto
              </button>
            </div>
          ) : (
            <>
              {/* Tarjeta de Descarga de Plantilla Oficial */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📥</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1E293B', display: 'block' }}>
                      ¿Necesitas el formato adecuado?
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Descarga nuestra plantilla oficial con columnas configuradas, ejemplos y guía de llenado.
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#107C41',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar Plantilla (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('csv')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#FFFFFF',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Descargar .csv
                  </button>
                </div>
              </div>

              {/* Zona de Drop / Carga de Archivo */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: isDragging ? '2px dashed #2A6F62' : '2px dashed #CBD5E1',
                  background: isDragging ? '#F0FDF4' : '#FAFAFA',
                  borderRadius: '10px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragging ? '#2A6F62' : '#64748B'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                      {fileName ? fileName : 'Haz clic o arrastra aquí tu archivo Excel o CSV'}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Compatible con formatos .xlsx, .xls y .csv (con detección automática de columnas)
                    </span>
                  </div>
                </div>
              </div>

              {parseError && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#B91C1C', fontSize: '13px' }}>
                  ⚠️ {parseError}
                </div>
              )}

              {/* Configuración de Proyecto Destino */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ fontSize: '13px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Destino de la Importación
                </strong>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="radio"
                      name="targetMode"
                      value="existing"
                      checked={targetMode === 'existing'}
                      onChange={() => setTargetMode('existing')}
                    />
                    Importar a un proyecto existente
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="radio"
                      name="targetMode"
                      value="new"
                      checked={targetMode === 'new'}
                      onChange={() => setTargetMode('new')}
                    />
                    Crear un nuevo proyecto e importar
                  </label>
                </div>

                {targetMode === 'existing' ? (
                  <div style={{ marginTop: '4px' }}>
                    <select
                      value={targetProjectId}
                      onChange={(e) => setTargetProjectId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        background: '#FFFFFF'
                      }}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name} ({p.space === 'personal' ? 'Personal' : 'Trabajo'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="Nombre del nuevo proyecto..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        background: '#FFFFFF'
                      }}
                    />
                    <select
                      value={newProjectSpace}
                      onChange={(e) => setNewProjectSpace(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="work">Trabajo · Empresa</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                )}

                {parsedPhases.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', marginTop: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoCreatePhases}
                      onChange={(e) => setAutoCreatePhases(e.target.checked)}
                    />
                    Registrar y sincronizar automáticamente las <strong>{parsedPhases.length} fases</strong> detectadas en el proyecto
                  </label>
                )}
              </div>

              {/* Vista Previa de Tareas */}
              {parsedRows.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>
                        Vista Previa de Tareas
                      </strong>
                      <span style={{ fontSize: '12px', background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', color: '#475569', fontWeight: 600 }}>
                        {parsedRows.length} encontradas
                      </span>
                      {parsedPhases.length > 0 && (
                        <span style={{ fontSize: '12px', background: '#E6F0EE', padding: '2px 8px', borderRadius: '12px', color: '#2A6F62', fontWeight: 600 }}>
                          {parsedPhases.length} fases detectadas
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Fase</th>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Tarea / Hito</th>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Estado</th>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Responsable</th>
                          <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Fechas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, i) => {
                          const badge = statusBadges[r.status] || statusBadges.backlog;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FBFDFD' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>
                                {r.id || '-'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {r.fase ? (
                                  <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
                                    {r.fase}{r.cierreMultifase ? ` → ${r.cierreMultifase}` : ''}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94A3B8' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#1E293B', maxWidth: '300px' }}>
                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.title}
                                </div>
                                {r.notas && (
                                  <div style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.notas}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                  {badge.label}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                                {r.resp || 'Jorge'}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#64748B', whiteSpace: 'nowrap', fontSize: '11px' }}>
                                {r.startDate && r.dueDate ? `${r.startDate} a ${r.dueDate}` : (r.dueDate || r.startDate || '-')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importSuccess && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#F8FAFC'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={loading || parsedRows.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                background: parsedRows.length === 0 ? '#94A3B8' : '#2A6F62',
                border: 0,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: parsedRows.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <span>Importando...</span>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Confirmar e importar {parsedRows.length > 0 ? `(${parsedRows.length} tareas)` : ''}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
