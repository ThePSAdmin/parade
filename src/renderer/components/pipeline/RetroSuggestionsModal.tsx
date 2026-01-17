import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Label } from '@renderer/components/ui/label';

interface RetroSuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: string[];
  onApprove: (selectedSuggestions: string[]) => void;
  onDismiss: () => void;
}

export function RetroSuggestionsModal({
  open,
  onOpenChange,
  suggestions,
  onApprove,
  onDismiss,
}: RetroSuggestionsModalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const selectAll = () => setSelected(new Set(suggestions.map((_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  const handleApprove = () => {
    const selectedSuggestions = Array.from(selected).map((i) => suggestions[i]);
    onApprove(selectedSuggestions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Retrospective Suggestions</DialogTitle>
          <DialogDescription className="text-slate-400">
            Review improvements identified during epic execution. Select which suggestions to apply.
          </DialogDescription>
        </DialogHeader>

        {/* Select All / Deselect All */}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={selectAll}
            className="text-sky-400 hover:text-sky-300"
          >
            Select All
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-sky-400 hover:text-sky-300"
          >
            Deselect All
          </button>
        </div>

        {/* Suggestions list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
              <Checkbox
                id={`suggestion-${index}`}
                checked={selected.has(index)}
                onCheckedChange={() => toggleSuggestion(index)}
              />
              <Label
                htmlFor={`suggestion-${index}`}
                className="text-sm text-slate-300 cursor-pointer flex-1"
              >
                {suggestion}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            Dismiss
          </Button>
          <Button onClick={handleApprove} disabled={selected.size === 0}>
            Approve Selected ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RetroSuggestionsModal;
