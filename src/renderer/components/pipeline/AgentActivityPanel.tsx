import { useEffect } from 'react';
import { useDiscoveryStore } from '../../store/discoveryStore';
import type { WorkflowEvent } from '../../../shared/types/discovery';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { getActivityIcon } from '@renderer/lib/iconMap';
import { Radio } from 'lucide-react';

// Map event types to display info
const EVENT_DISPLAY: Record<string, { label: string; color: string }> = {
  'discovery_started': { label: 'Discovery Started', color: 'text-sky-500' },
  'questions_generated': { label: 'Questions Generated', color: 'text-purple-500' },
  'questions_answered': { label: 'Questions Answered', color: 'text-emerald-500' },
  'sme_technical_complete': { label: 'Technical Review Done', color: 'text-amber-400' },
  'sme_business_complete': { label: 'Business Review Done', color: 'text-amber-400' },
  'spec_generated': { label: 'Spec Generated', color: 'text-sky-400' },
  'exported': { label: 'Exported to Beads', color: 'text-emerald-500' },
};

export default function AgentActivityPanel() {
  const { recentEvents, fetchRecentEvents, subscribeToChanges } = useDiscoveryStore();

  useEffect(() => {
    fetchRecentEvents(20);
    const unsubscribe = subscribeToChanges();
    return () => unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
          <Radio className="w-5 h-5 text-sky-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No recent activity</p>
            ) : (
              recentEvents.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ event }: { event: WorkflowEvent }) {
  const display = EVENT_DISPLAY[event.event_type] || {
    label: event.event_type,
    color: 'text-slate-500',
  };

  const ActivityIcon = getActivityIcon(event.event_type);
  const timeAgo = formatTimeAgo(event.created_at);

  return (
    <div className="flex items-start gap-3 p-2 hover:bg-slate-800 rounded transition-colors">
      <ActivityIcon className={`w-5 h-5 ${display.color}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${display.color}`}>{display.label}</p>
        <p className="text-xs text-slate-500 truncate">
          Brief: {event.brief_id}
        </p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
