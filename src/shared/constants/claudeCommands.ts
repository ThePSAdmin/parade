/**
 * Built-in Claude Code CLI commands
 * These are system commands provided by the Claude Code CLI,
 * separate from user-defined skills
 */

export interface BuiltInCommand {
  name: string;
  description: string;
}

export const BUILT_IN_COMMANDS: BuiltInCommand[] = [
  {
    name: 'bug',
    description: 'Report a bug',
  },
  {
    name: 'clear',
    description: 'Clear conversation context',
  },
  {
    name: 'compact',
    description: 'Compact conversation to reduce tokens',
  },
  {
    name: 'config',
    description: 'Open configuration',
  },
  {
    name: 'cost',
    description: 'Show token usage and cost',
  },
  {
    name: 'doctor',
    description: 'Check Claude Code installation',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
  {
    name: 'ide',
    description: 'IDE integration settings',
  },
  {
    name: 'init',
    description: 'Initialize Claude Code in a project',
  },
  {
    name: 'listen',
    description: 'Enable voice input mode',
  },
  {
    name: 'login',
    description: 'Authenticate with Anthropic',
  },
  {
    name: 'logout',
    description: 'Sign out',
  },
  {
    name: 'mcp',
    description: 'Manage MCP servers',
  },
  {
    name: 'memory',
    description: 'View/edit CLAUDE.md memory',
  },
  {
    name: 'model',
    description: 'Switch AI model',
  },
  {
    name: 'permissions',
    description: 'Manage tool permissions',
  },
  {
    name: 'pr-comments',
    description: 'Fetch PR comments',
  },
  {
    name: 'release-notes',
    description: 'View release notes',
  },
  {
    name: 'review',
    description: 'Review conversation',
  },
  {
    name: 'status',
    description: 'Show status info',
  },
  {
    name: 'terminal-setup',
    description: 'Set up terminal integration',
  },
  {
    name: 'vim',
    description: 'Toggle vim mode',
  },
];
