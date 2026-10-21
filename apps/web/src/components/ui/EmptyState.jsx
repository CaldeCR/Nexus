import React from 'react';

export function EmptyState({
  title = 'No hay elementos para mostrar',
  description = '',
  actionLabel = '',
  onAction = null,
  icon = null
}) {
  return (
    <div className="ui-empty-state">
      {icon && <div className="ui-empty-state__icon">{icon}</div>}
      <h3 className="ui-empty-state__title">{title}</h3>
      {description && <p className="ui-empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--small"
          onClick={onAction}
          style={{ marginTop: '12px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
