import { useState, useEffect, useCallback } from 'react';
import { Menu, X, FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/renderer/components/ui/button';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { FileTreeNav, FileTreeItem } from './FileTreeNav';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { DocFile, DocsListResult, DocsReadResult } from '@/shared/types/ipc';


/**
 * Simpler approach: build tree directly
 */
function buildFileTreeSimple(files: DocFile[]): FileTreeItem[] {
  const tree: FileTreeItem[] = [];
  const pathMap = new Map<string, FileTreeItem>();

  // Sort files to ensure parents are processed before children
  const sortedFiles = [...files].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  for (const file of sortedFiles) {
    const parts = file.relativePath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!pathMap.has(currentPath)) {
        const item: FileTreeItem = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };

        pathMap.set(currentPath, item);

        if (parentPath) {
          const parent = pathMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(item);
          }
        } else {
          tree.push(item);
        }
      }
    }
  }

  return tree;
}

/**
 * Empty state component when no file is selected
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <FileText className="w-16 h-16 mb-4 opacity-50" />
      <h2 className="text-xl font-medium mb-2 text-slate-300">No Document Selected</h2>
      <p className="text-sm text-center max-w-md">
        Select a markdown file from the sidebar to view its contents.
        <br />
        Documentation is read from <code className="bg-slate-800 px-1 rounded">docs/</code>,{' '}
        <code className="bg-slate-800 px-1 rounded">.claude/</code>, and{' '}
        <code className="bg-slate-800 px-1 rounded">.design/</code> directories.
      </p>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <div className="animate-pulse">
        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <div className="text-red-400 mb-4">
        <FileText className="w-12 h-12 opacity-50" />
      </div>
      <h2 className="text-lg font-medium mb-2 text-red-300">Error</h2>
      <p className="text-sm text-center max-w-md">{message}</p>
    </div>
  );
}

/**
 * DocsPage Component
 *
 * Three-column layout for documentation viewer:
 * - Left sidebar: FileTreeNav for navigation
 * - Main content: MarkdownRenderer for file content
 * - Right sidebar: Table of contents (handled by MarkdownRenderer)
 *
 * Features:
 * - Responsive: sidebar collapses below 768px
 * - IPC integration for file listing and reading
 * - Empty state when no file selected
 */
export function DocsPage() {
  // File tree state
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  // Selected file state
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load file list on mount
  useEffect(() => {
    async function loadFiles() {
      setLoadingFiles(true);
      setFilesError(null);

      try {
        const result: DocsListResult = await window.electron.docs.listFiles();

        if (result.error) {
          setFilesError(result.error);
          setFiles([]);
        } else {
          const tree = buildFileTreeSimple(result.files);
          setFiles(tree);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load files';
        setFilesError(message);
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    }

    loadFiles();
  }, []);

  // Load file content when selection changes
  useEffect(() => {
    if (!selectedPath) {
      setFileContent(null);
      setContentError(null);
      return;
    }

    async function loadContent() {
      setLoadingContent(true);
      setContentError(null);

      try {
        const result: DocsReadResult = await window.electron.docs.readFile(selectedPath!);

        if (result.error) {
          setContentError(result.error);
          setFileContent(null);
        } else {
          setFileContent(result.content);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to read file';
        setContentError(message);
        setFileContent(null);
      } finally {
        setLoadingContent(false);
      }
    }

    loadContent();
  }, [selectedPath]);

  // Handle file selection
  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
    // Close sidebar on mobile after selection
    setSidebarOpen(false);
  }, []);

  // Toggle sidebar (mobile)
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-full bg-slate-950 relative">
      {/* Mobile sidebar toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'fixed top-3 left-3 z-50 md:hidden',
          'bg-slate-900 hover:bg-slate-800 border border-slate-700'
        )}
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left sidebar - File tree navigation */}
      <aside
        className={cn(
          'w-64 min-w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950',
          'flex flex-col',
          // Mobile: fixed positioning with slide-in animation
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out',
          'md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Documentation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {files.length === 0 && !loadingFiles && !filesError
              ? 'No files found'
              : loadingFiles
              ? 'Loading...'
              : `${countFiles(files)} files`}
          </p>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-hidden">
          {loadingFiles ? (
            <LoadingState message="Loading files..." />
          ) : filesError ? (
            <div className="p-4">
              <p className="text-sm text-red-400">{filesError}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <p>No documentation files found.</p>
              <p className="text-xs mt-2">
                Add .md files to docs/, .claude/, or .design/
              </p>
            </div>
          ) : (
            <FileTreeNav
              items={files}
              selectedPath={selectedPath}
              onSelect={handleSelect}
            />
          )}
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Add padding for mobile toggle button */}
            <div className="md:hidden h-10" />

            {loadingContent ? (
              <LoadingState message="Loading document..." />
            ) : contentError ? (
              <ErrorState message={contentError} />
            ) : fileContent && selectedPath ? (
              <MarkdownRenderer content={fileContent} filePath={selectedPath} />
            ) : (
              <EmptyState />
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

/**
 * Count total files in a tree (excluding folders)
 */
function countFiles(items: FileTreeItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.type === 'file') {
      count++;
    } else if (item.children) {
      count += countFiles(item.children);
    }
  }
  return count;
}

export default DocsPage;
