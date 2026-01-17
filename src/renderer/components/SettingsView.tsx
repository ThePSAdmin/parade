import { useTheme } from '@renderer/hooks/useTheme';
import { Label } from '@renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';

/**
 * SettingsView Component
 *
 * Displays application settings including theme selection.
 */
export default function SettingsView() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Theme Section */}
      <div className="space-y-2">
        <Label htmlFor="theme-select">Theme</Label>
        <Select value={theme} onValueChange={handleThemeChange}>
          <SelectTrigger id="theme-select" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
