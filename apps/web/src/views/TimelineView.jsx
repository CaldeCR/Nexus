import React, { useState, useMemo } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';

export function TimelineView({
  projects = [],
  workItems = [],
  todayStr = '',
  onSelectProject,
  onOpenNewProject,
  onOpenJustification,
  onOpenNewExtension,
  onOpenStatusModal
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const [zoom, setZoom] = useState('weeks'); // 'weeks' | 'months'
  const [filterExt, setFilterExt] = useState('all'); // 'all' | 'extended' | 'ontrack'

  const DAY = 86400000;
  // Span: Aug 1 to Nov 30 (122 days)
  const origin = useMemo(() => Date.UTC(2026, 7, 1), []);
  const span = 122;

  const pos = (iso) => {
    if (!iso) return 50;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return 50;
    const [y, m, d] = parts;
    return Math.max(0, Math.min(100, ((Date.UTC(y, m - 1, d) - origin) / DAY / span) * 100));
  };

  const todayPos = pos(todayStr || '2026-10-20');

  const statusMeta = {
    review: { label: 'En revisión', dot: '#B98A1E', bg: '#D5E3DF', fill: '#2A6F62' },
    execution: { label: 'En ejecución', dot: '#2A6F62', bg: '#D5E3DF', fill: '#2A6F62' },
    preproject: { label: 'Preproyecto', dot: '#9AA4AC', bg: '#E4E8EA', fill: '#7A8791' },
    completed: { label: 'Finalizado', dot: '#4C8A45', bg: '#D9E7D6', fill: '#4C8A45' },
    discarded: { label: 'Descartado', dot: '#9AA4AC', bg: '#E4E8EA', fill: '#7A8791' }
  };

  const monthsShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthsFull = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const formatDateShort = (iso) => {
    if (!iso) return '';
    const parts = iso.split('-').map(Number);
    if (parts.length < 3) return iso;
    return `${parts[2]} ${monthsShort[parts[1] - 1]}`;
  };

  const formatDateFull = (iso) => {
    if (!iso) return '';
    const parts = iso.split('-').map(Number);
    if (parts.length < 3) return iso;
    return `${parts[2]} de ${monthsFull[parts[1] - 1]}, ${parts[0]}`;
  };

  // Month column definitions (August to November 2026)
  const monthColumns = useMemo(() => [
    { name: 'Agosto 2026', left: 0, width: (31 / 122) * 100, isCurrent: false },
    { name: 'Septiembre 2026', left: (31 / 122) * 100, width: (30 / 122) * 100, isCurrent: false },
    { name: 'Octubre 2026', left: (61 / 122) * 100, width: (31 / 122) * 100, isCurrent: true, sublabel: 'Mes Actual' },
    { name: 'Noviembre 2026', left: (92 / 122) * 100, width: (30 / 122) * 100, isCurrent: false }
  ], []);

  // Generate week column ticks
  const weekColumns = useMemo(() => {
    const list = [];
    const numWeeks = 17;
    for (let i = 0; i <= numWeeks; i++) {
      const dt = new Date(origin + i * 7 * DAY);
      const left = ((i * 7) / span) * 100;
      if (left <= 100) {
        list.push({
          label: `${dt.getUTCDate()} ${monthsShort[dt.getUTCMonth()]}`,
          left
        });
      }
    }
    return list;
  }, [origin, span, DAY]);

  // Project rows calculation
  const projectRows = useMemo(() => {
    return projects
      .filter((p) => {
        const hasExt = Boolean(
          p.hasExtension ||
          (p.originalTargetDate && p.targetDate && p.originalTargetDate < p.targetDate) ||
          (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0)
        );
        if (filterExt === 'extended') return hasExt;
        if (filterExt === 'ontrack') return !hasExt;
        return true;
      })
      .map((p, index) => {
        const st = statusMeta[p.status] || statusMeta.execution;
        const start = p.effectiveStartDate || p.startDate || (p.createdAt ? p.createdAt.split('T')[0] : '2026-09-01');
        const origTarget = p.effectiveOriginalTargetDate || p.originalTargetDate || p.targetDate || '2026-10-15';
        const finalTarget = p.effectiveTargetDate || p.targetDate || origTarget;

        const hasExtension = Boolean(
          p.hasExtension ||
          (origTarget && finalTarget && origTarget < finalTarget) ||
          (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0)
        );

        const total = p.totalTasks !== undefined ? p.totalTasks : (p.tasks?.length || 0);
        const done = p.doneTasks !== undefined ? p.doneTasks : (p.tasks?.filter((t) => t.status === 'done')?.length || 0);
        const pct = p.progressPct !== undefined ? p.progressPct : (total > 0 ? Math.round((done / total) * 100) : (p.status === 'completed' ? 100 : 0));

        const startPos = pos(start);
        const origEndPos = pos(origTarget);
        const finalEndPos = pos(finalTarget);

        let durationText = p.extensionDurationText || '';
        if (hasExtension && !durationText) {
          if (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0) {
            durationText = p.dateExtensions[p.dateExtensions.length - 1].durationText;
          } else {
            const d1 = new Date(origTarget + 'T12:00:00').getTime();
            const d2 = new Date(finalTarget + 'T12:00:00').getTime();
            const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            const weeks = Math.round(diffDays / 7);
            durationText = weeks >= 1 ? `${weeks} semanas` : `${diffDays} días`;
          }
        }

        let justificationReason = '';
        if (Array.isArray(p.dateExtensions) && p.dateExtensions.length > 0) {
          justificationReason = p.dateExtensions[p.dateExtensions.length - 1].reason;
        } else {
          justificationReason = p.description || 'El plazo original fue extendido. Clic para ver la justificación técnica documentada.';
        }

        // Geometry: split base and extension segments
        const baseWidth = Math.max(2.5, origEndPos - startPos);
        let extWidth = 0;
        let totalWidth = baseWidth;
        let baseRatio = 100;
        let extRatio = 0;

        if (hasExtension) {
          extWidth = Math.max(2.5, finalEndPos - origEndPos);
          totalWidth = baseWidth + extWidth;
          baseRatio = (baseWidth / totalWidth) * 100;
          extRatio = (extWidth / totalWidth) * 100;
        }

        // Direction & alignment of tooltip
        const tooltipDown = index < 2;
        const alignClass = startPos > 65 ? 'align-right' : startPos < 15 ? 'align-left' : '';

        return {
          ...p,
          statusMeta: st,
          start,
          origTarget,
          finalTarget,
          hasExtension,
          durationText,
          justificationReason,
          startPos,
          origEndPos,
          finalEndPos,
          baseWidth,
          extWidth,
          totalWidth,
          baseRatio,
          extRatio,
          total,
          done,
          pct,
          tooltipDown,
          alignClass,
          formattedRange: `${formatDateShort(start)} → ${formatDateShort(finalTarget)}`
        };
      });
  }, [projects, todayStr, origin, span, filterExt]);

  /* ========================================================================= */
  /* VISTA MÓVIL (< 768px)                                                     */
  /* ========================================================================= */
  if (isMobile) {
    return (
      <div style={{ flex: 1, padding: '12px 16px 88px 16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
        {projectRows.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#FFFFFF',
              border: '1px solid #DDE2E4',
              borderRadius: '8px',
              padding: '14px',
              color: '#1D2A33'
            }}
          >
            {/* Header del Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2A6F62', background: '#E6F0EE', padding: '2px 6px', borderRadius: '4px' }}>
                {r.code || 'PRJ'}
              </span>
              <span
                onClick={() => onSelectProject && onSelectProject(r.id)}
                style={{ flex: 1, fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              >
                {r.name}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D2A33' }}>{r.pct}%</span>
            </div>

            {/* Barra de Tiempo Mini con Segmento de Prórroga */}
            <div style={{ position: 'relative', height: '16px', background: '#F6F7F7', borderRadius: '4px', overflow: 'hidden' }}>
              {/* Línea de Hoy */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#C44536',
                  left: `${todayPos}%`,
                  zIndex: 3
                }}
              />

              {/* Barra Base */}
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  bottom: '2px',
                  borderRadius: r.hasExtension ? '3px 0 0 3px' : '3px',
                  background: r.statusMeta.bg,
                  left: `${r.startPos}%`,
                  width: `${r.baseWidth}%`,
                  overflow: 'hidden',
                  zIndex: 1
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${r.pct}%`,
                    background: r.pct === 100 ? '#4C8A45' : r.statusMeta.fill
                  }}
                />
              </span>

              {/* Segmento Extendido Rayado */}
              {r.hasExtension && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    bottom: '2px',
                    borderRadius: '0 3px 3px 0',
                    background: 'repeating-linear-gradient(-45deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.25) 4px, rgba(217, 119, 6, 0.45) 4px, rgba(217, 119, 6, 0.45) 8px)',
                    border: '1px dashed #D97706',
                    borderLeft: 'none',
                    left: `${r.origEndPos}%`,
                    width: `${r.extWidth}%`,
                    zIndex: 1
                  }}
                />
              )}
            </div>

            {/* Fila Inferior con Estado y Botones */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#5F6B76' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.statusMeta.dot }} />
                <span>{r.statusMeta.label}</span>
                <span>·</span>
                <span>{r.done}/{r.total} tareas</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onOpenStatusModal && onOpenStatusModal(r)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #DDE2E4',
                    background: '#FFFFFF',
                    color: '#1D2A33',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  📄 Estatus
                </button>

                {r.hasExtension ? (
                  <button
                    type="button"
                    onClick={() => onOpenJustification && onOpenJustification(r)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #D97706',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#B45309',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚠️ +{r.durationText}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenNewExtension && onOpenNewExtension(r)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px dashed #DDE2E4',
                      background: '#FFFFFF',
                      color: '#5F6B76',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Prórroga
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ========================================================================= */
  /* VISTA ESCRITORIO / TABLET                                                 */
  /* ========================================================================= */
  return (
    <div style={{ flex: 1, minWidth: 0, padding: bp === 'tablet' ? '24px 28px' : '32px 40px 40px 40px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      {/* Cabecera Principal */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#5F6B76', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Control de Portafolio
          </p>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#1D2A33' }}>
            Cronograma & Avance
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Filtro por estado de prórroga */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setFilterExt('all')}
              style={{
                height: '32px',
                padding: '0 12px',
                border: 0,
                borderRadius: '4px',
                background: filterExt === 'all' ? '#EDF0F0' : 'transparent',
                color: filterExt === 'all' ? '#1D2A33' : '#5F6B76',
                font: 'inherit',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterExt('extended')}
              style={{
                height: '32px',
                padding: '0 12px',
                border: 0,
                borderRadius: '4px',
                background: filterExt === 'extended' ? '#EDF0F0' : 'transparent',
                color: filterExt === 'extended' ? '#B45309' : '#5F6B76',
                font: 'inherit',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>⚠️</span> Con prórroga
            </button>
            <button
              type="button"
              onClick={() => setFilterExt('ontrack')}
              style={{
                height: '32px',
                padding: '0 12px',
                border: 0,
                borderRadius: '4px',
                background: filterExt === 'ontrack' ? '#EDF0F0' : 'transparent',
                color: filterExt === 'ontrack' ? '#1D2A33' : '#5F6B76',
                font: 'inherit',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              En plazo
            </button>
          </div>

          {/* Zoom switcher */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setZoom('weeks')}
              style={{
                height: '32px',
                padding: '0 12px',
                border: 0,
                borderRadius: '4px',
                background: zoom === 'weeks' ? '#EDF0F0' : 'transparent',
                color: zoom === 'weeks' ? '#1D2A33' : '#5F6B76',
                font: 'inherit',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Semanas
            </button>
            <button
              type="button"
              onClick={() => setZoom('months')}
              style={{
                height: '32px',
                padding: '0 12px',
                border: 0,
                borderRadius: '4px',
                background: zoom === 'months' ? '#EDF0F0' : 'transparent',
                color: zoom === 'months' ? '#1D2A33' : '#5F6B76',
                font: 'inherit',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Meses
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewProject}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px',
              padding: '0 16px',
              border: 0,
              borderRadius: '6px',
              background: '#2A6F62',
              color: '#FFFFFF',
              font: 'inherit',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo proyecto
          </button>
        </div>
      </div>

      {/* Contenedor Principal del Gantt */}
      <div style={{ background: '#FFFFFF', border: '1px solid #DDE2E4', borderRadius: '8px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(15, 52, 70, 0.04)' }}>
        <div style={{ minWidth: '1060px' }}>
          {/* Fila Superior de Meses */}
          <div style={{ display: 'flex', borderBottom: '1px solid #DDE2E4', background: '#F8FAFA', height: '48px' }}>
            <div
              style={{
                width: '360px',
                flex: 'none',
                padding: '0 20px',
                borderRight: '1px solid #DDE2E4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 700,
                color: '#5F6B76',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <span>Proyecto & Metas</span>
              <span>Cumplimiento</span>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              {monthColumns.map((m) => (
                <div
                  key={m.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${m.left}%`,
                    width: `${m.width}%`,
                    borderRight: '1px solid #DDE2E4',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingLeft: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: m.isCurrent ? '#2A6F62' : '#1D2A33' }}>
                      {m.name}
                    </span>
                    {m.isCurrent && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#2A6F62',
                          background: '#E6F0EE',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Mes Actual
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicador de HOY en la cabecera */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: `${todayPos}%`,
                  transform: 'translateX(-50%)',
                  background: '#C44536',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  zIndex: 5,
                  boxShadow: '0 2px 6px rgba(196, 69, 54, 0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Hoy · {formatDateShort(todayStr)}
              </div>
            </div>
          </div>

          {/* Fila Subordinada de Semanas (Visible en zoom 'weeks') */}
          {zoom === 'weeks' && (
            <div style={{ display: 'flex', borderBottom: '1px solid #EDEFF0', background: '#FFFFFF', height: '26px' }}>
              <div style={{ width: '360px', flex: 'none', borderRight: '1px solid #DDE2E4' }} />
              <div style={{ flex: 1, position: 'relative' }}>
                {weekColumns.map((w) => (
                  <div
                    key={w.left}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${w.left}%`,
                      paddingLeft: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#8A96A0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {w.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filas de Proyectos */}
          {projectRows.map((r) => (
            <div
              key={r.id}
              className="roadmap-timeline-row"
              style={{
                display: 'flex',
                borderBottom: '1px solid #EDEFF0',
                minHeight: '66px',
                alignItems: 'center'
              }}
            >
              {/* Columna Izquierda: Información del Proyecto & Acciones Rápidas */}
              <div
                style={{
                  width: '360px',
                  flex: 'none',
                  padding: '10px 20px',
                  borderRight: '1px solid #DDE2E4',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Línea 1: Código + Nombre + Etapa */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2A6F62',
                      background: '#E6F0EE',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  >
                    {r.code || 'PRJ'}
                  </span>
                  <span
                    onClick={() => onSelectProject && onSelectProject(r.id)}
                    style={{
                      flex: 1,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#1D2A33',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer'
                    }}
                    title={r.name}
                  >
                    {r.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.statusMeta.dot }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#5F6B76' }}>{r.statusMeta.label}</span>
                  </div>
                </div>

                {/* Línea 2: Cumplimiento de tareas + Botones Estatus y Prórroga */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#5F6B76', fontWeight: 500 }}>
                    {r.done}/{r.total} tareas ({r.pct}%)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onOpenStatusModal && onOpenStatusModal(r)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #DDE2E4',
                        background: '#FFFFFF',
                        color: '#1D2A33',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      title="Ver Ficha Ejecutiva de Estatus"
                    >
                      <span>📄</span>
                      <span>Estatus</span>
                    </button>

                    {r.hasExtension ? (
                      <button
                        type="button"
                        onClick={() => onOpenJustification && onOpenJustification(r)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #D97706',
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: '#B45309',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        title="Clic para ver justificación técnica de la prórroga"
                      >
                        <span>⚠️</span>
                        <span>+{r.durationText}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenNewExtension && onOpenNewExtension(r)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px dashed #DDE2E4',
                          background: '#FFFFFF',
                          color: '#5F6B76',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        title="Registrar prórroga o cambio de fecha pactada"
                      >
                        <span>+</span>
                        <span>Prórroga</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Barra de Cronograma Compuesta */}
              <div style={{ flex: 1, position: 'relative', height: '66px', display: 'flex', alignItems: 'center' }}>
                {/* Líneas guía de semanas */}
                {weekColumns.map((w) => (
                  <span
                    key={w.left}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${w.left}%`,
                      width: '1px',
                      background: '#F0F2F2'
                    }}
                  />
                ))}

                {/* Líneas divisorias de meses */}
                {monthColumns.map((m) => (
                  <span
                    key={m.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${m.left}%`,
                      width: '1px',
                      background: '#E2E6E8',
                      zIndex: 1
                    }}
                  />
                ))}

                {/* Línea vertical de HOY */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${todayPos}%`,
                    width: '2px',
                    background: '#C44536',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}
                />

                {/* BARRA COMPUESTA DE PROYECTO */}
                <div
                  className="roadmap-bar-composite"
                  style={{
                    left: `${r.startPos}%`,
                    width: `${r.totalWidth}%`,
                    height: '38px',
                    top: '14px'
                  }}
                >
                  {/* PIN DE FECHA DE INICIO */}
                  <div
                    className="roadmap-start-pin"
                    data-date={`Inicio: ${formatDateShort(r.start)}`}
                    title={`Inicio: ${formatDateFull(r.start)}`}
                  />

                  {/* TRAMO BASE (TIEMPO PACTADO ORIGINAL) */}
                  <div
                    className={`roadmap-bar-base ${!r.hasExtension ? 'is-single-pill' : ''}`}
                    style={{ width: `${r.baseRatio}%` }}
                    onClick={() => onSelectProject && onSelectProject(r.id)}
                  >
                    <div
                      className="roadmap-progress-fill"
                      style={{ width: `${r.pct}%` }}
                    />
                    <div className="roadmap-bar-labels">
                      <span className="roadmap-bar-start-label">▶ {formatDateShort(r.start)}</span>
                      <span className="roadmap-bar-prog-label">{r.pct}%</span>
                      <span className="roadmap-bar-end-label">
                        {r.hasExtension ? formatDateShort(r.origTarget) : `🏁 ${formatDateShort(r.origTarget)}`}
                      </span>
                    </div>

                    {/* PIN DE FECHA PACTADA / DIVISOR ORIGINAL */}
                    {r.hasExtension ? (
                      <div
                        className="roadmap-original-pin"
                        data-date={`Pactado: ${formatDateShort(r.origTarget)}`}
                        title={`Límite pactado original: ${formatDateFull(r.origTarget)}`}
                      />
                    ) : (
                      <div
                        className="roadmap-original-pin"
                        data-date={`Meta: ${formatDateShort(r.origTarget)}`}
                        title={`Fecha de finalización: ${formatDateFull(r.origTarget)}`}
                      />
                    )}

                    {/* TOOLTIP HOVER DEL PROYECTO (IMAGEN 1 O IMAGEN 3) */}
                    <div className={`roadmap-bar-hover-tooltip ${r.tooltipDown ? 'tooltip-down' : ''} ${r.alignClass}`}>
                      <div className="roadmap-tooltip-header">
                        {r.code && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              background: 'rgba(42, 111, 98, 0.25)',
                              color: '#5EEAD4',
                              borderRadius: '4px',
                              fontWeight: 800
                            }}
                          >
                            {r.code}
                          </span>
                        )}
                        <span style={{ color: '#38BDF8', fontWeight: 700 }}>{r.name}</span>
                      </div>

                      <div className="roadmap-tooltip-dates-grid">
                        <div className="tooltip-date-row">
                          <span className="tooltip-date-label">📅 Fecha de Inicio:</span>
                          <span className="tooltip-date-val is-start">{formatDateFull(r.start)}</span>
                        </div>

                        {!r.hasExtension ? (
                          <div className="tooltip-date-row">
                            <span className="tooltip-date-label">🏁 Fecha de Finalización:</span>
                            <span className="tooltip-date-val is-end">{formatDateFull(r.origTarget)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="tooltip-date-row">
                              <span className="tooltip-date-label">🏁 Pactado Original:</span>
                              <span className="tooltip-date-val is-end">{formatDateFull(r.origTarget)}</span>
                            </div>
                            <div className="tooltip-date-row">
                              <span className="tooltip-date-label">⚠️ Nueva Meta (Prórroga):</span>
                              <span className="tooltip-date-val is-ext">
                                {formatDateFull(r.finalTarget)} (+{r.durationText})
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="roadmap-tooltip-progress-row">
                        Avance: <strong>{r.pct}%</strong> ({r.done}/{r.total} tareas)
                      </div>

                      <div
                        className="roadmap-tooltip-cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject && onSelectProject(r.id);
                        }}
                      >
                        {!r.hasExtension
                          ? '🗂️ Clic para ver tareas en Kanban'
                          : '🗂️ Clic en barra para Kanban / Clic en prórroga para justificación'}
                      </div>
                    </div>
                  </div>

                  {/* TRAMO EXTENDIDO CON RAYADO Y TOOLTIP DE PRÓRROGA (IMAGEN 2) */}
                  {r.hasExtension && (
                    <div
                      className="roadmap-bar-extension"
                      style={{ width: `${r.extRatio}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJustification && onOpenJustification(r);
                      }}
                    >
                      <span className="roadmap-extension-pill">
                        <span>⚠️ +{r.durationText}</span>
                      </span>

                      {/* TOOLTIP INTERACTIVO AL PASAR SOBRE LA PRÓRROGA (IMAGEN 2) */}
                      <div className={`roadmap-extension-tooltip ${r.tooltipDown ? 'tooltip-down' : ''} ${r.alignClass}`}>
                        <div className="roadmap-tooltip-header">
                          <span>&gt; TIEMPO EXTENDIDO, {r.durationText.toUpperCase()}</span>
                        </div>
                        <div className="roadmap-tooltip-body">
                          {r.justificationReason}
                        </div>
                        <div className="roadmap-tooltip-dates">
                          <div>
                            <strong>Pactado original:</strong> {formatDateShort(r.origTarget)}
                          </div>
                          <div style={{ color: '#fbbf24' }}>
                            <strong>Nueva meta:</strong> {formatDateShort(r.finalTarget)}
                          </div>
                        </div>
                        <div
                          className="roadmap-tooltip-cta"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenJustification && onOpenJustification(r);
                          }}
                        >
                          🗂️ Clic para ver la justificación técnica
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda Visual Inferior */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', fontSize: '12px', color: '#5F6B76', padding: '4px 6px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '28px', height: '10px', borderRadius: '4px', background: '#0F3446', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', background: '#2A6F62' }} />
          </span>
          Plan y avance real
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '28px', height: '10px', borderRadius: '4px', background: 'repeating-linear-gradient(-45deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.25) 4px, rgba(217, 119, 6, 0.45) 4px, rgba(217, 119, 6, 0.45) 8px)', border: '1px dashed #D97706' }} />
          Prórroga / Tiempo extendido
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '2px', height: '14px', background: '#f59e0b', boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)' }} />
          Fecha pactada original
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '2px', height: '14px', background: '#C44536' }} />
          Línea de Hoy
        </span>
      </div>
    </div>
  );
}
