import React from 'react';

const TAG_PALETTE = [
  'var(--tag-1)',
  'var(--tag-2)',
  'var(--tag-3)',
  'var(--tag-4)',
  'var(--tag-5)',
  'var(--tag-6)'
];

function hashStringToIndex(str, max) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

export function ProjectMark({ project, showName = true, className = '' }) {
  if (!project) return null;
  const name = typeof project === 'string' ? project : project.name;
  const code = project.code || '';
  const color = TAG_PALETTE[hashStringToIndex(name, TAG_PALETTE.length)];

  return (
    <span className={`ui-project-mark ${className}`}>
      <span
        className="ui-project-mark__dot"
        style={{ background: color }}
        aria-hidden="true"
      />
      {showName && (
        <span className="ui-project-mark__name">
          {code ? `${code} · ${name}` : name}
        </span>
      )}
    </span>
  );
}
