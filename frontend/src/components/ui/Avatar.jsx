import React from 'react';

export function Avatar({
  src,
  name = 'User',
  size = 'md', // 'sm' (32) | 'md' (40) | 'lg' (48) | 'xl' (64)
  online = null, // boolean or null
  className = ''
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover border border-[var(--line)] shadow-xs ${sizeClasses[size] || sizeClasses.md}`}
        />
      ) : (
        <div
          className={`rounded-full bg-[var(--seg-active)] text-white font-sans font-bold flex items-center justify-center border border-[var(--line)] shadow-xs ${
            sizeClasses[size] || sizeClasses.md
          }`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Online indicator dot */}
      {online !== null && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            online ? 'bg-[var(--accent-strong)]' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
}

export default Avatar;

