import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Clock, Flame } from 'lucide-react';
import type { StalenessLevel } from '../lib/calc/staleness';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, color = 'bg-slate-700 text-slate-100', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${color} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

interface StalenessBadgeProps {
  staleness: StalenessLevel;
  compact?: boolean; // アイコンのみ
}

const STALE_ICONS: Record<StalenessLevel['level'], ReactNode> = {
  fresh: null,
  warning: <Clock size={10} />,
  alert: <AlertTriangle size={10} />,
  critical: <Flame size={10} />,
};

export function StalenessBadge({ staleness, compact = false }: StalenessBadgeProps) {
  const icon = STALE_ICONS[staleness.level];
  return (
    <Badge color={staleness.color} icon={icon} className="whitespace-nowrap">
      {compact ? `${staleness.days}d` : staleness.label}
    </Badge>
  );
}

interface OverloadBadgeProps {
  variant: 'inProgress' | 'reviewStall' | 'remainingPoints';
}

const OVERLOAD_LABELS = {
  inProgress: '進行中5+',
  reviewStall: 'Review滞留',
  remainingPoints: '負荷大',
};

const OVERLOAD_COLORS = {
  inProgress: 'bg-red-700 text-red-100',
  reviewStall: 'bg-orange-700 text-orange-100',
  remainingPoints: 'bg-amber-700 text-amber-100',
};

export function OverloadBadge({ variant }: OverloadBadgeProps) {
  return (
    <Badge color={OVERLOAD_COLORS[variant]} icon={<AlertCircle size={10} />}>
      {OVERLOAD_LABELS[variant]}
    </Badge>
  );
}
