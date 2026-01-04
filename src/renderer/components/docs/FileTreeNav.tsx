import { useState, useCallback } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  Settings,
  Hash,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
}

export interface FileTreeNavProps {
  items: FileTreeItem[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

/**
 * Get the appropriate icon for a file based on its name/extension
 */
function getFileIcon(name: string) {
  const lowerName = name.toLowerCase();

  // Settings/config files
  if (
    lowerName.includes('config') ||
    lowerName.includes('settings') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.yaml') ||
    lowerName.endsWith('.yml') ||
    lowerName.endsWith('.toml')
  ) {
    return Settings;
  }

  // Hash/ID files (like .md with IDs, database files)
  if (
    lowerName.endsWith('.db') ||
    lowerName.endsWith('.sqlite') ||
    lowerName.includes('index')
  ) {
    return Hash;
  }

  // Default to FileText
  return FileText;
}

/**
 * Count total items (files + folders) in a folder recursively
 */
function countItems(items: FileTreeItem[]): number {
  return items.reduce((count, item) => {
    if (item.type === 'folder' && item.children) {
      return count + 1 + countItems(item.children);
    }
    return count + 1;
  }, 0);
}

interface FileTreeNodeProps {
  item: FileTreeItem;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}

function FileTreeNode({
  item,
  depth,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggle
}: FileTreeNodeProps) {
  const isFolder = item.type === 'folder';
  const isExpanded = expandedPaths.has(item.path);
  const isSelected = selectedPath === item.path;
  const hasChildren = isFolder && item.children && item.children.length > 0;

  const FileIcon = isFolder
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(item.name);

  const itemCount = hasChildren ? countItems(item.children!) : 0;

  const handleClick = () => {
    if (isFolder) {
      onToggle(item.path);
    } else {
      onSelect(item.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="select-none">
      <div
        role="treeitem"
        tabIndex={0}
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-1.5 py-1 px-2 cursor-pointer rounded-sm transition-colors',
          'hover:bg-slate-800',
          isSelected && 'bg-slate-800 text-sky-400',
          !isSelected && 'text-slate-300'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/collapse chevron for folders */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )
            ) : null}
          </span>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* File/folder icon */}
        <FileIcon
          className={cn(
            'w-4 h-4 shrink-0',
            isFolder ? 'text-amber-400' : 'text-slate-400',
            isSelected && !isFolder && 'text-sky-400'
          )}
        />

        {/* Name */}
        <span className="text-sm truncate flex-1">{item.name}</span>

        {/* Item count for folders */}
        {isFolder && hasChildren && (
          <span className="text-xs text-slate-500 shrink-0">
            {itemCount}
          </span>
        )}
      </div>

      {/* Render children if expanded */}
      {isFolder && isExpanded && item.children && (
        <div role="group">
          {item.children.map((child) => (
            <FileTreeNode
              key={child.path}
              item={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeNav({ items, selectedPath, onSelect }: FileTreeNavProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        No files to display
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <nav role="tree" aria-label="File tree navigation" className="py-2">
        {items.map((item) => (
          <FileTreeNode
            key={item.path}
            item={item}
            depth={0}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            onSelect={onSelect}
            onToggle={handleToggle}
          />
        ))}
      </nav>
    </ScrollArea>
  );
}

export default FileTreeNav;
