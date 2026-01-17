import { useMemo } from 'react';
import { BUILT_IN_COMMANDS } from '@shared/constants/claudeCommands';
import { useAgentSkills } from '../store/agentStore';

export interface Command {
  name: string;
  description: string;
  category: 'builtin' | 'skill';
}

/**
 * Hook that merges built-in Claude Code commands with available skills
 * into a unified Command[] array for autocomplete features.
 */
export function useAllCommands(): Command[] {
  const skills = useAgentSkills();

  return useMemo(() => {
    // Map built-in commands to Command interface
    const builtInCommands: Command[] = BUILT_IN_COMMANDS.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      category: 'builtin' as const,
    }));

    // Map skills to Command interface
    const skillCommands: Command[] = skills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      category: 'skill' as const,
    }));

    // Merge and sort alphabetically by name
    return [...builtInCommands, ...skillCommands].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [skills]);
}
