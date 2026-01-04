import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  FileText,
  Search,
  CheckCircle,
  Play,
} from 'lucide-react';

export interface GuideStepCardProps {
  stepNumber: number;
  id: string;
  command: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: (id: string) => void;
  className?: string;
}

/**
 * Get the appropriate icon for a workflow step
 */
function getStepIcon(id: string) {
  switch (id) {
    case 'init-project':
      return FolderOpen;
    case 'discover':
      return Search;
    case 'approve-spec':
      return CheckCircle;
    case 'run-tasks':
      return Play;
    default:
      return FileText;
  }
}

/**
 * GuideStepCard Component
 *
 * Displays a single workflow step in the guide. Shows step number, command,
 * title, and description. Supports selection state and keyboard navigation.
 */
export const GuideStepCard = React.forwardRef<HTMLDivElement, GuideStepCardProps>(
  (
    {
      stepNumber,
      id,
      command,
      title,
      description,
      isSelected,
      onClick,
      className,
    },
    ref
  ) => {
    const Icon = getStepIcon(id);

    const handleClick = () => {
      onClick(id);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(id);
      }
    };

    return (
      <div
        ref={ref}
        data-testid={`guide-step-card-${id}`}
        data-selected={isSelected ? 'true' : 'false'}
        role="listitem"
        tabIndex={0}
        aria-label={`Step ${stepNumber}: ${title}`}
        aria-current={isSelected ? 'step' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'cursor-pointer rounded-lg border p-4 transition-all',
          'hover:bg-accent/50 hover:border-accent',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isSelected
            ? 'border-primary bg-primary/10 ring-2 ring-primary'
            : 'border-border bg-card opacity-80',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Step number badge */}
          <div
            data-testid="step-number"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {stepNumber}
          </div>

          {/* Icon */}
          <div
            data-testid="step-icon"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center',
              isSelected ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h2 className="font-semibold text-foreground">{title}</h2>

            {/* Command */}
            <code
              className={cn(
                'mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-mono',
                isSelected
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {command}
            </code>

            {/* Description */}
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

GuideStepCard.displayName = 'GuideStepCard';

export default GuideStepCard;
