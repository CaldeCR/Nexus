import React from 'react';

const AVATAR_PALETTE = ['#2A6F62', '#0F3446', '#4A6B7A', '#7A5C3E', '#5C6670'];

function hashStringToIndex(str, max) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

export function Avatar({ name = '', size = 26, title = '' }) {
  const cleanName = String(name || '').trim();
  const initials = cleanName
    ? cleanName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  const bgColor = AVATAR_PALETTE[hashStringToIndex(cleanName, AVATAR_PALETTE.length)];
  const tooltip = title || cleanName;

  return (
    <span
      className="ui-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: bgColor,
        fontSize: size <= 22 ? '10px' : size <= 28 ? '11px' : '13px'
      }}
      title={tooltip}
      aria-label={tooltip}
    >
      {initials}
    </span>
  );
}

export function AvatarGroup({ names = [], max = 3, size = 24 }) {
  const list = Array.isArray(names) ? names.filter(Boolean) : [];
  const visible = list.slice(0, max);
  const remaining = list.length - max;

  if (list.length === 0) {
    return <span className="ui-avatar-empty" title="Sin asignar">—</span>;
  }

  return (
    <div className="ui-avatar-group">
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} />
      ))}
      {remaining > 0 && (
        <span
          className="ui-avatar ui-avatar--more"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            fontSize: '10px'
          }}
          title={`+${remaining} más (${list.slice(max).join(', ')})`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
