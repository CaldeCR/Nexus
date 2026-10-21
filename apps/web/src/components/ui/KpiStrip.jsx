import React from 'react';
import { ProgressBar } from './ProgressBar';

export function KpiStrip({
  items,
  activeProjectsCount = 0,
  openTasksCount = 0,
  overdueTasksCount = 0,
  avgProgressPct = 0
}) {
  if (Array.isArray(items) && items.length > 0) {
    return (
      <div className="ui-kpi-strip" role="region" aria-label="Resumen de indicadores">
        {items.map((item, idx) => (
          <div key={item.label || idx} className="ui-kpi-cell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: item.progress !== undefined ? '4px' : 0 }}>
              <span className="ui-kpi-label">{item.label}</span>
              {item.progress !== undefined && (
                <strong className="ui-kpi-value-sm" style={{ color: item.color || 'inherit' }}>
                  {item.value}
                </strong>
              )}
            </div>
            {item.progress !== undefined ? (
              <ProgressBar value={item.progress} height={4} />
            ) : (
              <strong className="ui-kpi-value" style={{ color: item.color || 'inherit' }}>
                {item.value}
              </strong>
            )}
            {item.sublabel && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginTop: '2px', display: 'block' }}>
                {item.sublabel}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ui-kpi-strip" role="region" aria-label="Resumen de indicadores">
      {/* Celda 1: Proyectos activos */}
      <div className="ui-kpi-cell">
        <span className="ui-kpi-label">Proyectos activos</span>
        <strong className="ui-kpi-value">{activeProjectsCount}</strong>
      </div>

      {/* Celda 2: Tareas abiertas */}
      <div className="ui-kpi-cell">
        <span className="ui-kpi-label">Tareas abiertas</span>
        <strong className="ui-kpi-value">{openTasksCount}</strong>
      </div>

      {/* Celda 3: Fuera de fecha */}
      <div className="ui-kpi-cell">
        <span className="ui-kpi-label">Fuera de fecha</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <strong
            className="ui-kpi-value"
            style={{ color: overdueTasksCount > 0 ? 'var(--status-late-ink)' : 'inherit' }}
          >
            {overdueTasksCount}
          </strong>
          {overdueTasksCount > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--status-late-ink)', fontWeight: 600 }}>
              requieren atención
            </span>
          )}
        </div>
      </div>

      {/* Celda 4: Avance general */}
      <div className="ui-kpi-cell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="ui-kpi-label">Avance general</span>
          <strong className="ui-kpi-value-sm">{avgProgressPct}%</strong>
        </div>
        <ProgressBar value={avgProgressPct} height={4} />
      </div>
    </div>
  );
}
