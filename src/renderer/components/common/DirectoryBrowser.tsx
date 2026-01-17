import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronUp, Home, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../lib/api/httpClient';

interface DirectoryEntry {
  name: string;
  path: string;
  hidden: boolean;
}

interface BrowseResult {
  current: string;
  parent: string;
  isRoot: boolean;
  directories: DirectoryEntry[];
}

interface Shortcut {
  name: string;
  path: string;
}

interface DirectoryBrowserProps {
  onSelect: (path: string) => void;
  onCancel: () => void;
}

export function DirectoryBrowser({ onSelect, onCancel }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [directories, setDirectories] = useState<DirectoryEntry[]>([]);
  const [parent, setParent] = useState<string | null>(null);
  const [isRoot, setIsRoot] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValidProject, setIsValidProject] = useState<boolean | null>(null);

  // Load shortcuts on mount
  useEffect(() => {
    api.get<{ shortcuts: Shortcut[] }>('/api/filesystem/shortcuts')
      .then((result) => setShortcuts(result.shortcuts))
      .catch(() => setShortcuts([]));
  }, []);

  // Load directory contents
  const loadDirectory = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    setIsValidProject(null);

    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : '';
      const result = await api.get<BrowseResult>(`/api/filesystem/browse${params}`);
      setCurrentPath(result.current);
      setParent(result.parent);
      setIsRoot(result.isRoot);
      setDirectories(result.directories);

      // Check if this is a valid project directory
      setValidating(true);
      const validation = await api.get<{ valid: boolean }>(`/api/filesystem/validate-project?path=${encodeURIComponent(result.current)}`);
      setIsValidProject(validation.valid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  }, []);

  // Load initial directory
  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // Filter directories based on showHidden
  const visibleDirectories = showHidden
    ? directories
    : directories.filter((d) => !d.hidden);

  const handleSelect = () => {
    onSelect(currentPath);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden max-w-lg w-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 bg-slate-800">
        <h3 className="text-sm font-medium text-slate-200">Select Project Folder</h3>
        <p className="text-xs text-slate-400 mt-1 truncate" title={currentPath}>
          {currentPath || 'Loading...'}
        </p>
      </div>

      {/* Shortcuts */}
      {shortcuts.length > 0 && (
        <div className="p-2 border-b border-slate-700 flex flex-wrap gap-1">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.path}
              onClick={() => loadDirectory(shortcut.path)}
              className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
            >
              <Home className="w-3 h-3" />
              {shortcut.name}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="p-2 border-b border-slate-700 flex items-center gap-2">
        <button
          onClick={() => parent && loadDirectory(parent)}
          disabled={isRoot || loading}
          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
          title="Go up"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="rounded border-slate-600"
          />
          Show hidden
        </label>
      </div>

      {/* Directory list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-sm">{error}</div>
        ) : visibleDirectories.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No subdirectories</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {visibleDirectories.map((dir) => (
              <button
                key={dir.path}
                onClick={() => loadDirectory(dir.path)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-left group"
              >
                <Folder className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className={`text-sm truncate flex-1 ${dir.hidden ? 'text-slate-500' : 'text-slate-300'}`}>
                  {dir.name}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current selection indicator */}
      <div className="p-2 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs">
          {validating ? (
            <span className="text-slate-400">Checking...</span>
          ) : isValidProject === true ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Valid project (.beads/ found)</span>
            </>
          ) : isValidProject === false ? (
            <>
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">No .beads/ folder (run `bd init` first)</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-slate-700 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSelect}
          disabled={!currentPath}
          className="bg-sky-600 hover:bg-sky-700"
        >
          <Check className="w-4 h-4 mr-1" />
          Select This Folder
        </Button>
      </div>
    </div>
  );
}
