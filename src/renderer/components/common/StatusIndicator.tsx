import type { BriefStatus, SpecStatus } from '../../../shared/types/discovery';
import type { LucideIcon } from 'lucide-react';
import { StatusIcons } from '../../lib/iconMap';

type Status = BriefStatus | SpecStatus | 'blocked' | 'failed' | 'success';

const STATUS_CONFIG: Record<Status, { Icon: LucideIcon; color: string; bgColor: string; label: string }> = {
  draft: { Icon: StatusIcons.draft, color: 'text-slate-400', bgColor: 'bg-slate-800', label: 'Draft' },
  in_discovery: { Icon: StatusIcons.in_discovery, color: 'text-sky-400', bgColor: 'bg-sky-950', label: 'In Discovery' },
  spec_ready: { Icon: StatusIcons.spec_ready, color: 'text-amber-400', bgColor: 'bg-amber-950', label: 'Spec Ready' },
  approved: { Icon: StatusIcons.approved, color: 'text-emerald-400', bgColor: 'bg-emerald-950', label: 'Approved' },
  exported: { Icon: StatusIcons.exported, color: 'text-purple-400', bgColor: 'bg-purple-950', label: 'Active' },
  in_progress: { Icon: StatusIcons.in_progress, color: 'text-blue-400', bgColor: 'bg-blue-950', label: 'In Progress' },
  completed: { Icon: StatusIcons.completed, color: 'text-green-400', bgColor: 'bg-green-950', label: 'Completed' },
  canceled: { Icon: StatusIcons.canceled, color: 'text-red-400', bgColor: 'bg-red-950', label: 'Canceled' },
  review: { Icon: StatusIcons.review, color: 'text-amber-400', bgColor: 'bg-amber-950', label: 'Review' },
  blocked: { Icon: StatusIcons.blocked, color: 'text-red-400', bgColor: 'bg-red-950', label: 'Blocked' },
  failed: { Icon: StatusIcons.failed, color: 'text-red-400', bgColor: 'bg-red-950', label: 'Failed' },
  success: { Icon: StatusIcons.success, color: 'text-emerald-400', bgColor: 'bg-emerald-950', label: 'Success' },
};

interface StatusIndicatorProps {
  status: Status;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusIndicator({ status, showLabel = false, size = 'md' }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const { Icon } = config;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className={config.color} />
      {showLabel && <span className="font-medium">{config.label}</span>}
    </span>
  );
}
