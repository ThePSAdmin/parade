// Permission dialog for approving/denying tool calls

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import {
  FileEdit,
  FilePlus,
  Trash2,
  Terminal,
  GitBranch,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { PermissionRequest, PermissionType } from '../../../shared/types/agent';

interface PermissionDialogProps {
  permission: PermissionRequest | null;
  onApprove: (rememberForSession?: boolean) => void;
  onDeny: () => void;
}

const permissionIcons: Record<PermissionType, React.ReactNode> = {
  file_read: <FileText className="h-5 w-5 text-blue-500" />,
  file_edit: <FileEdit className="h-5 w-5 text-yellow-500" />,
  file_create: <FilePlus className="h-5 w-5 text-green-500" />,
  file_delete: <Trash2 className="h-5 w-5 text-red-500" />,
  bash_readonly: <Terminal className="h-5 w-5 text-blue-500" />,
  bash_write: <Terminal className="h-5 w-5 text-yellow-500" />,
  bash_git: <GitBranch className="h-5 w-5 text-purple-500" />,
};

const permissionLabels: Record<PermissionType, string> = {
  file_read: 'Read File',
  file_edit: 'Edit File',
  file_create: 'Create File',
  file_delete: 'Delete File',
  bash_readonly: 'Run Command (Read-only)',
  bash_write: 'Run Command',
  bash_git: 'Git Command',
};

const permissionDescriptions: Record<PermissionType, string> = {
  file_read: 'The agent wants to read a file.',
  file_edit: 'The agent wants to modify an existing file.',
  file_create: 'The agent wants to create a new file.',
  file_delete: 'The agent wants to delete a file. This action cannot be undone.',
  bash_readonly: 'The agent wants to run a read-only command.',
  bash_write: 'The agent wants to run a command that may modify files.',
  bash_git: 'The agent wants to run a git command.',
};

export function PermissionDialog({
  permission,
  onApprove,
  onDeny,
}: PermissionDialogProps) {
  const [rememberForSession, setRememberForSession] = useState(false);

  if (!permission) return null;

  const isDestructive = permission.type === 'file_delete';
  const Icon = permissionIcons[permission.type];

  const handleApprove = () => {
    onApprove(rememberForSession);
    setRememberForSession(false);
  };

  const handleDeny = () => {
    onDeny();
    setRememberForSession(false);
  };

  return (
    <Dialog open={!!permission} onOpenChange={() => handleDeny()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon}
            {permissionLabels[permission.type]}
          </DialogTitle>
          <DialogDescription>
            {permissionDescriptions[permission.type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Details */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">{permission.description}</p>

            {permission.filePath && (
              <div className="text-xs text-muted-foreground font-mono break-all">
                {permission.filePath}
              </div>
            )}

            {permission.command && (
              <ScrollArea className="h-24 mt-2">
                <pre className="text-xs font-mono bg-background p-2 rounded">
                  {permission.command}
                </pre>
              </ScrollArea>
            )}
          </div>

          {/* Warning for destructive actions */}
          {isDestructive && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                This action is destructive and cannot be undone. Please review
                carefully before approving.
              </p>
            </div>
          )}

          {/* Remember option */}
          {!isDestructive && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberForSession}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setRememberForSession(checked === true)
                }
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Remember for this session (auto-approve similar requests)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDeny}>
            Deny
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleApprove}
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PermissionDialog;
