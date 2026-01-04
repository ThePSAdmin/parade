import type { Brief, BriefStatus } from '../../../shared/types/discovery';
import BriefCard from './BriefCard';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Badge } from '@renderer/components/ui/badge';
import { StatusIcons } from '@renderer/lib/iconMap';

interface PipelineColumnProps {
  title: string;
  status: BriefStatus;
  briefs: Brief[];
}

const statusConfig: Record<BriefStatus, { color: string }> = {
  draft: { color: 'text-slate-400' },
  in_discovery: { color: 'text-sky-500' },
  spec_ready: { color: 'text-amber-400' },
  approved: { color: 'text-emerald-500' },
  exported: { color: 'text-purple-500' },
  in_progress: { color: 'text-blue-500' },
  completed: { color: 'text-green-500' },
  canceled: { color: 'text-red-500' },
};

export default function PipelineColumn({ title, status, briefs }: PipelineColumnProps) {
  const config = statusConfig[status];
  const StatusIcon = StatusIcons[status];

  return (
    <div className="flex flex-col w-72 min-w-72 rounded-lg bg-slate-900 border border-slate-800">
      {/* Column header */}
      <div className="p-3 font-semibold border-b border-slate-800">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <span className="text-slate-100">{title}</span>
          <Badge variant="secondary" className="ml-auto bg-slate-800 text-slate-400 border-slate-700">
            {briefs.length}
          </Badge>
        </div>
      </div>

      {/* Cards container */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} />
          ))}
          {briefs.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              No items
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
