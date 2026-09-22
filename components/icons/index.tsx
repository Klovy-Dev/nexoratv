/**
 * Icônes de l'interface. SVG inline, sans dépendance ni requête réseau,
 * même approche que components/PlatformLogos.tsx. Trait = currentColor,
 * donc la couleur se pilote en CSS (`color: ...`) côté appelant.
 */

type Props = { size?: number; className?: string };

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TvIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 19v2" />
    </svg>
  );
}

export function BoltIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function MonitorIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function FilmIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="7" y1="5" x2="7" y2="19" />
      <line x1="17" y1="5" x2="17" y2="19" />
      <line x1="3" y1="9" x2="7" y2="9" />
      <line x1="3" y1="15" x2="7" y2="15" />
      <line x1="17" y1="9" x2="21" y2="9" />
      <line x1="17" y1="15" x2="21" y2="15" />
    </svg>
  );
}

export function LockIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}

export function ChatIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.62-.32-3.75-.9L3 21l1.9-5.75A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

export function UsersIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="9" cy="8" r="3.5" />
      <path d="M20 20v-1.5a3.2 3.2 0 0 0-2.2-3" />
      <path d="M14.5 4.7a3.5 3.5 0 0 1 0 6.6" />
    </svg>
  );
}

export function ReceiptIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

export function TagIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12.6 3H6a3 3 0 0 0-3 3v6.6a2 2 0 0 0 .59 1.41l8.4 8.4a2 2 0 0 0 2.82 0l6.6-6.6a2 2 0 0 0 0-2.82l-8.4-8.4A2 2 0 0 0 12.6 3z" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BookIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3z" />
    </svg>
  );
}

export function LogIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="13" y2="18" />
    </svg>
  );
}

export function GameControllerIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="2" y="7" width="20" height="11" rx="5.5" />
      <line x1="7" y1="10.5" x2="7" y2="14.5" />
      <line x1="5" y1="12.5" x2="9" y2="12.5" />
      <circle cx="16" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MailIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6.5 8-6.5" />
    </svg>
  );
}

export function CheckIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ChartIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="13" width="3.2" height="7" />
      <rect x="10.4" y="8" width="3.2" height="12" />
      <rect x="14.8" y="4" width="3.2" height="16" />
    </svg>
  );
}

export function TrashIcon({ size = 24, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M18.5 7 17.8 19a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5.5 7" />
      <line x1="10" y1="11" x2="10" y2="16" />
      <line x1="14" y1="11" x2="14" y2="16" />
    </svg>
  );
}
