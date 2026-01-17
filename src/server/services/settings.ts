// Server-compatible settings service - uses file-based storage instead of Electron app.getPath

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Project, Settings } from '../../shared/types/settings';

export type { Project, Settings };

class ServerSettingsService {
  private settings: Settings = {};
  private settingsPath: string;

  constructor() {
    // Store settings in ~/.config/parade/settings.json (XDG-compliant)
    const configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    const paradeConfigDir = path.join(configDir, 'parade');
    this.settingsPath = path.join(paradeConfigDir, 'settings.json');
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

      console.log('Migration complete. Created project:', this.settings.projects[0]);
      this.save();
    }
  }

  private generateProjectId(): string {
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

export const serverSettingsService = new ServerSettingsService();
export default serverSettingsService;
