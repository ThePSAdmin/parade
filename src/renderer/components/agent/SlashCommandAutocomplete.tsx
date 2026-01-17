import React, { forwardRef, useMemo, useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAllCommands, Command } from '../../hooks/useAllCommands';

interface SlashCommandAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SlashCommandAutocomplete = forwardRef<
  HTMLInputElement,
  SlashCommandAutocompleteProps
>(({ value, onChange, onKeyDown, placeholder, disabled }, ref) => {
  const commands = useAllCommands();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands when input starts with /
  const filteredCommands = useMemo(() => {
    if (!value.startsWith('/')) {
      return [];
    }

    const query = value.slice(1).toLowerCase(); // Remove leading /
    const filtered = commands.filter((cmd) =>
      cmd.name.toLowerCase().startsWith(query)
    );

    return filtered;
  }, [value, commands]);

  // Show dropdown when there are filtered commands
  useEffect(() => {
    setShowDropdown(filteredCommands.length > 0);
    setSelectedIndex(0); // Reset selection when filter changes
  }, [filteredCommands.length]);

  // Handle click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredCommands.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === filteredCommands.length - 1 ? 0 : prev + 1
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === 0 ? filteredCommands.length - 1 : prev - 1
          );
          break;

        case 'Tab':
        case 'Enter':
          e.preventDefault();
          acceptCommand(filteredCommands[selectedIndex]);
          break;

        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          break;

        default:
          // Allow normal typing
          break;
      }
    }

    // Call original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Accept selected command
  const acceptCommand = (command: Command) => {
    onChange(`/${command.name} `);
    setShowDropdown(false);
  };

  // Handle command click
  const handleCommandClick = (command: Command) => {
    acceptCommand(command);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Dropdown positioned above input */}
      {showDropdown && (
        <div
          role="listbox"
          id="command-listbox"
          aria-label="Available commands"
          className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-[200px] overflow-y-auto z-50"
        >
          {filteredCommands.map((command, index) => (
            <div
              key={command.name}
              role="option"
              id={`command-${command.name}`}
              aria-selected={index === selectedIndex}
              className={`px-3 py-2 cursor-pointer hover:bg-slate-700 ${
                index === selectedIndex ? 'bg-slate-700' : ''
              }`}
              onClick={() => handleCommandClick(command)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100">
                  /{command.name}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    command.category === 'builtin'
                      ? 'bg-slate-700'
                      : 'bg-sky-900/50'
                  }`}
                >
                  {command.category}
                </span>
              </div>
              <div className="text-sm text-slate-400 truncate">
                {command.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-controls={showDropdown ? "command-listbox" : undefined}
        aria-activedescendant={
          selectedIndex >= 0 && filteredCommands[selectedIndex]
            ? `command-${filteredCommands[selectedIndex].name}`
            : undefined
        }
      />
    </div>
  );
});

SlashCommandAutocomplete.displayName = 'SlashCommandAutocomplete';
