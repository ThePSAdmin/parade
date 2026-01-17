import { useBeadsStore } from '@renderer/store/beadsStore';
import { Badge } from '@renderer/components/ui/badge';

interface AgentActivityBadgeProps {
  epicId: string;
}

/**
 * Badge component that displays the count of active agents working on an epic.
 * Subscribes to beads store for real-time updates.
 */
export function AgentActivityBadge({ epicId }: AgentActivityBadgeProps) {
  const issues = useBeadsStore((state) => state.issues);

  // Filter tasks: belongs to epic, status is in_progress, has agent:* label
  const activeAgentTasks = issues.filter((issue) => {
    if (issue.parent !== epicId) return false;
    if (issue.status !== 'in_progress') return false;
    if (!issue.labels || issue.labels.length === 0) return false;
    return issue.labels.some((label) => label.startsWith('agent:'));
  });

  const count = activeAgentTasks.length;

  // Return nothing if no active agents
  if (count === 0) {
    return null;
  }

  // Singular/plural text
  const text = count === 1 ? '1 agent' : `${count} agents`;

  return (
    <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30">
      {text}
    </Badge>
  );
}
