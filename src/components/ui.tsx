import type { ReactNode } from 'react';

export function Spinner() {
  return (
    <div className="center">
      <div className="spinner" />
    </div>
  );
}

export function MoodBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mood-row">
      <span className="mood-label">{label}</span>
      <div className="mood-track">
        <div className="mood-fill" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <strong style={{ color, fontSize: 12, width: 16, textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

export function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`switch ${on ? 'on' : ''}`} onClick={onToggle} aria-pressed={on}>
      <span />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
