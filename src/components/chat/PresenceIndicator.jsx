import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  online: {
    label: 'En línea',
    dot: 'bg-emerald-300 ring-emerald-100/90 shadow-[0_0_6px_2px_rgba(52,211,153,0.95),0_0_16px_5px_rgba(16,185,129,0.7)]',
    pulse: 'bg-emerald-300',
    text: 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]',
  },
  idle: {
    label: 'Ausente',
    dot: 'bg-amber-300 ring-amber-100/90 shadow-[0_0_6px_2px_rgba(252,211,77,0.95),0_0_16px_5px_rgba(245,158,11,0.7)]',
    pulse: 'bg-amber-300',
    text: 'text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.9)]',
  },
  offline: {
    label: 'Desconectado',
    dot: 'bg-rose-400 ring-rose-100/90 shadow-[0_0_6px_2px_rgba(251,113,133,0.95),0_0_16px_5px_rgba(244,63,94,0.65)]',
    pulse: 'bg-rose-400',
    text: 'text-rose-300 drop-shadow-[0_0_6px_rgba(251,113,133,0.85)]',
  },
};

const normalizeStatus = (status) => (
  status === 'online' || status === 'idle' ? status : 'offline'
);

export const PresenceDot = ({ status = 'offline', className, size = 'md' }) => {
  const normalized = normalizeStatus(status);
  const config = statusConfig[normalized];
  const sizeClass = size === 'sm' ? 'h-2.5 w-2.5' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <span
      className={cn('relative inline-flex flex-none items-center justify-center', sizeClass, className)}
      title={config.label}
      aria-label={config.label}
    >
      <span
        className={cn(
          'absolute inset-0 rounded-full opacity-70',
          config.pulse,
          normalized === 'online' ? 'animate-ping' : 'animate-pulse'
        )}
      />
      <span className={cn('relative h-full w-full rounded-full ring-2', config.dot)} />
    </span>
  );
};

export const PresenceLabel = ({ status = 'offline', className }) => {
  const normalized = normalizeStatus(status);
  const config = statusConfig[normalized];

  return (
    <span className={cn('inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]', config.text, className)}>
      <PresenceDot status={normalized} size="sm" />
      {config.label}
    </span>
  );
};

export default PresenceDot;
