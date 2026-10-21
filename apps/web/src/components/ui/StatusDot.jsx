import React from 'react';

const STATUS_MAP = {
  backlog:    { label: 'Pendiente',    color: 'var(--status-backlog)' },
  in_progress:{ label: 'En curso',     color: 'var(--status-progress)' },
  review:     { label: 'En revisión',  color: 'var(--status-review)' },
  execution:  { label: 'En ejecución', color: 'var(--status-progress)' },
  preproject: { label: 'Preproyecto',  color: 'var(--status-backlog)' },
  completed:  { label: 'Finalizado',   color: 'var(--status-done)' },
  done:       { label: 'Hecho',        color: 'var(--status-done)' },
  discarded:  { label: 'Descartado',   color: 'var(--neutral-600)' }
};

export function StatusDot({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.backlog;
  return (
    <span className="ui-status">
      <span className="ui-status__dot" style={{ background: s.color }} aria-hidden="true" />
      <span className="ui-status__label">{s.label}</span>
    </span>
  );
}
