import React from 'react';
import { X, Inbox } from 'lucide-react';

// Small building blocks shared by the admin and staff dashboards, so the two
// render the same card, table, badge and modal instead of each restyling
// them. Dark theme throughout — both dashboards sit on #17181A.

export const INPUT_CLASS =
  'w-full px-3 py-2 rounded-xl bg-[#17181A] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4A72C]';

export const SectionCard = ({ title, description, actions, children, className = '' }) => (
  <section className={`bg-[#222326] rounded-2xl border border-gray-800 overflow-hidden ${className}`}>
    {(title || actions) && (
      <div className="px-5 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          {title && <h3 className="font-bold text-white text-sm">{title}</h3>}
          {description && <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

const TONES = {
  gold: 'bg-[#D4A72C]/10 border-[#D4A72C]/40 text-[#D4A72C]',
  green: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
  blue: 'bg-blue-500/10 border-blue-500/40 text-blue-400',
  amber: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
  red: 'bg-red-500/10 border-red-500/40 text-red-400',
  gray: 'bg-gray-700/30 border-gray-700 text-gray-300',
};

export const StatTile = ({ label, value, hint, icon: Icon, tone = 'gold' }) => (
  <div className={`rounded-2xl border p-4 ${TONES[tone] || TONES.gold}`}>
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</span>
      {Icon && <Icon className="w-4 h-4 opacity-80 flex-shrink-0" />}
    </div>
    <p className="text-2xl font-extrabold text-white mt-2">{value}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const Badge = ({ tone = 'gray', children }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${TONES[tone] || TONES.gray}`}>
    {children}
  </span>
);

// Status -> colour, shared so the same word never shows in two colours
// across the two dashboards.
export function statusTone(status) {
  const value = String(status || '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'PAID', 'PRESENT', 'ISSUED', 'COMPLETED'].includes(value)) return 'green';
  if (['PENDING', 'APPLIED', 'UPCOMING', 'DRAFT', 'PARTIAL'].includes(value)) return 'amber';
  if (['REJECTED', 'DROPPED', 'SUSPENDED', 'REVOKED', 'ABSENT', 'OVERDUE'].includes(value)) return 'red';
  return 'gray';
}

// One place that decides what to render while a list is loading, failed or
// came back empty, so no screen silently shows a blank area.
export const AsyncState = ({ loading, error, isEmpty, emptyMessage, onRetry, children }) => {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-12 rounded-xl bg-gray-800/60 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-4 text-xs text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span>{error}</span>
        {onRetry && (
          <button onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-red-500/20 font-bold hover:bg-red-500/30 flex-shrink-0">
            Try again
          </button>
        )}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="py-10 text-center text-xs text-gray-500">
        <Inbox className="w-8 h-8 mx-auto mb-3 text-gray-700" />
        <p>{emptyMessage || 'Nothing here yet.'}</p>
      </div>
    );
  }
  return children;
};

// Horizontal scroll rather than a squashed table on small screens.
export const TableWrap = ({ headers, children }) => (
  <div className="overflow-x-auto -mx-5 px-5">
    <table className="w-full min-w-[640px] text-xs">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
          {headers.map((header) => (
            <th key={header} className="py-2.5 pr-4 font-bold whitespace-nowrap">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">{children}</tbody>
    </table>
  </div>
);

export const IconButton = ({ onClick, title, tone = 'gray', icon: Icon, disabled, children }) => {
  const toneClass = {
    gold: 'bg-[#D4A72C] text-[#17181A] hover:bg-[#B88918]',
    green: 'bg-emerald-600 text-white hover:bg-emerald-500',
    red: 'bg-red-600/90 text-white hover:bg-red-500',
    gray: 'bg-gray-700 text-gray-200 hover:bg-gray-600',
  }[tone] || 'bg-gray-700 text-gray-200 hover:bg-gray-600';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${toneClass}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
};

export const Field = ({ label, hint, error, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</span>
    {children}
    {hint && !error && <span className="block text-[10px] text-gray-500 mt-1">{hint}</span>}
    {error && <span className="block text-[10px] text-red-400 mt-1">{error}</span>}
  </label>
);

export const ModalShell = ({ isOpen, title, icon: Icon, onClose, children, footer, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-[#222326] border border-[#D4A72C]/40 rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} my-8 shadow-2xl z-10`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#D4A72C]" />} {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
