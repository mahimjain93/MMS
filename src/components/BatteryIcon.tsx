import type { Battery } from '../storage';

export function BatteryIcon({ level }: { level: Battery }) {
  const w = level === 'full' ? 12 : level === 'half' ? 7 : 3;
  return (
    <svg width="20" height="11" viewBox="0 0 20 11" aria-hidden="true" className="shrink-0">
      <rect x="0.5" y="0.5" width="16" height="10" rx="2" fill="none" stroke="currentColor" />
      <rect x="17.5" y="3.5" width="2" height="4" rx="0.5" fill="currentColor" />
      <rect x="2.5" y="2.5" width={w} height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
