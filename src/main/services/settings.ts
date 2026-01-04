// Settings service - persistent app configuration

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { Project, Settings } from '../../shared/types/settings';

// Re-export types for backward compatibility
export type { Project, Settings };

class SettingsService {
  private settings: Settings = {};
  private settingsPath: string;

  constructor() {
    // Store settings in app's user data directory
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        this.settings = JSON.parse(data);
        console.log('Settings loaded from:', this.settingsPath);

        // Migration: convert old single-project format to new multi-project format
        this.migrateToMultiProject();
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      this.settings = {};
    }
  }

  private migrateToMultiProject() {
    // If old format exists but new format doesn't, migrate
    if (this.settings.beadsProjectPath && !this.settings.projects) {
      console.log('Migrating from single-project to multi-project format...');

      const legacyPath = this.settings.beadsProjectPath;
      const projectName = path.basename(legacyPath);

      this.settings.projects = [
        {
          id: this.generateProjectId(),
          name: projectName,
          path: legacyPath,
          addedAt: new Date().toISOString(),
          isActive: true,
        },
      ];

      // Keep the old field for any legacy code that might still reference it
      // It will be phased out in future versions
      console.log('Migration complete. Created project:', this.settings.projects[0]);

      // Save the migrated settings
      this.save();
    }
  }

  private generateProjectId(): string {
    // Generate a simple unique ID (timestamp + random)
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private save() {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved to:', this.settingsPath);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.settings[key] = value;
    this.save();
  }

  getAll(): Settings {
    return { ...this.settings };
  }
}

export const settingsService = new SettingsService();
export default settingsService;
