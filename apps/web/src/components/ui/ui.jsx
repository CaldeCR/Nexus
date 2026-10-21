export function Button({ variant = 'primary', fullWidth = false, loading = false, children, ...props }) {
  return (
    <button
      className={`ui-btn ui-btn--${variant} ${fullWidth ? 'ui-btn--full' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="ui-btn__spinner" aria-label="Cargando" /> : null}
      {children}
    </button>
  );
}

export function Card({ title, icon, actions, children, className = '' }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {(title || actions) && (
        <div className="ui-card__header">
          <div className="ui-card__title-wrap">
            {icon ? <span className="ui-card__icon">{icon}</span> : null}
            {title ? <strong>{title}</strong> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({ children, tone = 'info' }) {
  return <span className={`ui-chip ui-chip--${tone}`}>{children}</span>;
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="ui-field">
      {label ? <span className="ui-label">{label}</span> : null}
      {children}
      {error ? <span className="ui-error">{error}</span> : null}
      {!error && hint ? <span className="ui-hint">{hint}</span> : null}
    </label>
  );
}

export function Input({ error, ...props }) {
  return <input className={`ui-input ${error ? 'is-error' : ''}`.trim()} {...props} />;
}

export function Textarea({ error, ...props }) {
  return <textarea className={`ui-textarea ${error ? 'is-error' : ''}`.trim()} {...props} />;
}

export function Select({ error, children, ...props }) {
  return (
    <select className={`ui-select ${error ? 'is-error' : ''}`.trim()} {...props}>
      {children}
    </select>
  );
}
