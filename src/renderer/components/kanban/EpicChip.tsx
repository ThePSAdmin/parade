/**
 * EpicChip Component
 *
 * A clickable badge/chip that displays the parent epic title.
 * Used on task cards in the Kanban view to show which epic a task belongs to.
 * Clicking the chip can trigger navigation to the epic in the Pipeline view.
 */

import React from 'react';
import { Tag } from 'lucide-react';
import { useEpicStore } from '../../hooks/useEpicStore';

export interface EpicChipProps {
  /** The parent epic's bead ID */
  parentId?: string;
  /** Optional click callback - receives parentId */
  onClick?: (parentId: string) => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * EpicChip - displays parent epic as a clickable badge
 */
export function EpicChip({ parentId, onClick, className = '' }: EpicChipProps): React.ReactElement | null {
  const { getEpicById } = useEpicStore();

  // Don't render if no parentId
  if (!parentId || parentId === '') {
    return null;
  }

  // Look up the epic info
  const epicInfo = getEpicById(parentId);

  // Get display text - use epic title if found, otherwise show raw ID as fallback
  const displayText = epicInfo?.title ?? parentId;

  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent card click
    e.stopPropagation();
    if (onClick) {
      onClick(parentId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick(parentId);
      }
    }
  };

  const baseClasses = [
    'inline-flex',
    'items-center',
    'gap-1',
    'px-2',
    'py-0.5',
    'text-xs',
    'rounded-full',
    'bg-purple-900/30',
    'text-purple-300',
    'border',
    'border-purple-800',
    'truncate',
    'max-w-full',
    'overflow-hidden',
  ];

  // Add interactive styles if onClick is provided
  if (onClick) {
    baseClasses.push(
      'cursor-pointer',
      'hover:bg-purple-800/40',
      'hover:border-purple-600',
      'transition-colors'
    );
  }

  return (
    <span
      data-testid="epic-chip"
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Epic: ${displayText}`}
      className={`${baseClasses.join(' ')} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Tag
        className="w-3 h-3 flex-shrink-0"
        data-testid="epic-chip-icon"
      />
      <span className="truncate">{displayText}</span>
    </span>
  );
}
