import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  height = 4,
  showLabel = false,
  sublabel = '',
  className = ''
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const isComplete = pct === 100;

  return (
    <div className={`ui-progress-wrapper ${className}`}>
      {showLabel && (
        <div className="ui-progress-label-row">
          <span className="ui-progress-pct">{pct}%</span>
          {sublabel && <span className="ui-progress-sublabel">{sublabel}</span>}
        </div>
      )}
      <div
        className="ui-progress-track"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="ui-progress-fill"
          style={{
            width: `${pct}%`,
            background: isComplete ? 'var(--nexus-green)' : 'var(--nexus-teal)'
          }}
        />
      </div>
    </div>
  );
}
