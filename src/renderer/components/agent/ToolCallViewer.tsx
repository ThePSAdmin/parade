// Expandable tool call details viewer

import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallContent, ToolResultContent } from '../../../shared/types/agent';

interface ToolCallViewerProps {
  toolCall: ToolCallContent;
  result?: ToolResultContent;
  isActive?: boolean;
}

const toolColors: Record<string, string> = {
  Read: 'text-blue-500 bg-blue-500/10',
  Edit: 'text-yellow-500 bg-yellow-500/10',
  Write: 'text-green-500 bg-green-500/10',
  Bash: 'text-purple-500 bg-purple-500/10',
  Glob: 'text-cyan-500 bg-cyan-500/10',
  Grep: 'text-orange-500 bg-orange-500/10',
  Task: 'text-pink-500 bg-pink-500/10',
};

export function ToolCallViewer({
  toolCall,
  result,
  isActive,
}: ToolCallViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorClass = toolColors[toolCall.toolName] || 'text-gray-500 bg-gray-500/10';

  // Get a summary of the input
  const getSummary = () => {
    const input = toolCall.input;
    if (toolCall.toolName === 'Read' || toolCall.toolName === 'Write' || toolCall.toolName === 'Edit') {
      return (input.file_path as string) || (input.path as string) || '';
    }
    if (toolCall.toolName === 'Bash') {
      const command = (input.command as string) || '';
      return command.length > 60 ? command.substring(0, 60) + '...' : command;
    }
    if (toolCall.toolName === 'Glob' || toolCall.toolName === 'Grep') {
      return (input.pattern as string) || '';
    }
    return Object.keys(input).length > 0 ? JSON.stringify(input).substring(0, 50) + '...' : '';
  };

  return (
    <div className="border rounded-md overflow-hidden my-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors',
          isExpanded && 'bg-muted/30'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}

        <span className={cn('font-mono text-xs px-1.5 py-0.5 rounded', colorClass)}>
          {toolCall.toolName}
        </span>

        <span className="text-muted-foreground truncate flex-1 text-left font-mono text-xs">
          {getSummary()}
        </span>

        {/* Status indicator */}
        {isActive && (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        )}
        {result && !result.isError && (
          <Check className="h-4 w-4 text-green-500" />
        )}
        {result?.isError && (
          <X className="h-4 w-4 text-red-500" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t">
          {/* Input */}
          <div className="p-3 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
            <pre className="text-xs font-mono overflow-auto max-h-40 p-2 bg-background rounded">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {result && (
            <div className="p-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {result.isError ? 'Error' : 'Result'}
              </p>
              <pre
                className={cn(
                  'text-xs font-mono overflow-auto max-h-60 p-2 rounded whitespace-pre-wrap',
                  result.isError
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-background'
                )}
              >
                {result.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ToolCallViewer;
