import React, { useState, useEffect } from 'react';

export const Avatar = ({ src, name = 'User', size = 'md', className = '', online = false }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Generate deterministic gradient based on name
  const getGradient = (n) => {
    const colors = [
      'from-emerald-400 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash += n.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover shadow-sm ring-2 ring-white/60 dark:ring-slate-800/80`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${getGradient(
            name
          )} flex items-center justify-center text-white font-bold tracking-wide shadow-sm ring-2 ring-white/60 dark:ring-slate-800/80`}
        >
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
      )}
    </div>
  );
};
export default Avatar;
