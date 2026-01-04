import { useState, useCallback, DragEvent } from 'react';
import { FolderOpen } from 'lucide-react';

interface DragDropZoneProps {
  onFolderDrop: (path: string) => void;
}

export default function DragDropZone({ onFolderDrop }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // Get dropped items
      const items = Array.from(e.dataTransfer.items);

      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();

          // Validate it's a directory
          if (entry && entry.isDirectory) {
            // Get the full path
            const path = (entry as any).fullPath;
            onFolderDrop(path);
            return; // Only handle the first valid directory
          }
        }
      }

      // If no directory was found, try the files array
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        // For directories, path property should exist
        const path = (file as any).path;
        if (path) {
          onFolderDrop(path);
        }
      }
    },
    [onFolderDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center
        rounded-xl border-2 border-dashed
        p-8 transition-all cursor-pointer
        ${
          isDragOver
            ? 'border-sky-500 bg-sky-500/10'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800'
        }
      `}
    >
      <FolderOpen
        size={48}
        className={`mb-4 transition-colors ${isDragOver ? 'text-sky-400' : 'text-slate-500'}`}
      />
      <p className={`text-sm font-medium transition-colors ${isDragOver ? 'text-sky-400' : 'text-slate-400'}`}>
        {isDragOver ? 'Drop folder here' : 'Drag folder here'}
      </p>
    </div>
  );
}
