// Main agent panel component with chat UI and skill buttons

import { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  Bot,
  Send,
  Square,
  Loader2,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  useAgentStore,
  useAgentMessages,
  useAgentSkills,
  useIsAgentStreaming,
  usePendingPermission,
} from '../../store/agentStore';
import { PermissionDialog } from './PermissionDialog';
import { ToolCallViewer } from './ToolCallViewer';
import type { AgentMessage, ToolCallContent, ToolResultContent } from '../../../shared/types/agent';

// Quick action skills to show as buttons
const QUICK_SKILLS = ['discover', 'run-tasks', 'approve-spec', 'retro'];

export function AgentPanel() {
  const skills = useAgentSkills();
  const messages = useAgentMessages();
  const isStreaming = useIsAgentStreaming();
  const pendingPermission = usePendingPermission();

  const {
    inputValue,
    setInputValue,
    fetchSkills,
    runSkill,
    continueSession,
    cancelSession,
    approvePermission,
    denyPermission,
    subscribeToAgentEvents,
    error,
    clearError,
  } = useAgentStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeSessionId } = useAgentStore();

  // Fetch skills and subscribe to events on mount
  useEffect(() => {
    fetchSkills();
    const unsubscribe = subscribeToAgentEvents();
    return () => unsubscribe();
  }, [fetchSkills, subscribeToAgentEvents]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (activeSessionId) {
      // Continue existing session
      continueSession(inputValue.trim());
    } else {
      // Start new session with freeform prompt (empty skill name)
      runSkill('', inputValue.trim());
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRunSkill = (skillName: string) => {
    runSkill(skillName);
  };

  // Group consecutive tool calls with their results
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    let pendingToolCalls: Map<string, { call: ToolCallContent; result?: ToolResultContent }> = new Map();

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.type === 'tool_call' && msg.content.type === 'tool_call') {
        const key = `${msg.content.toolName}_${i}`;
        pendingToolCalls.set(key, { call: msg.content });
        continue;
      }

      if (msg.type === 'tool_result' && msg.content.type === 'tool_result') {
        // Try to find matching tool call
        const toolName = msg.content.toolName;
        for (const [key, value] of pendingToolCalls.entries()) {
          if (key.startsWith(toolName) && !value.result) {
            value.result = msg.content;
            break;
          }
        }
        continue;
      }

      // Flush any pending tool calls before rendering other messages
      if (pendingToolCalls.size > 0) {
        elements.push(
          <div key={`tools_${i}`} className="my-2">
            {Array.from(pendingToolCalls.entries()).map(([key, { call, result }]) => (
              <ToolCallViewer key={key} toolCall={call} result={result} />
            ))}
          </div>
        );
        pendingToolCalls = new Map();
      }

      elements.push(renderMessage(msg));
    }

    // Flush remaining tool calls
    if (pendingToolCalls.size > 0) {
      elements.push(
        <div key="tools_final" className="my-2">
          {Array.from(pendingToolCalls.entries()).map(([key, { call, result }]) => (
            <ToolCallViewer key={key} toolCall={call} result={result} isActive={isStreaming} />
          ))}
        </div>
      );
    }

    return elements;
  };

  const renderMessage = (msg: AgentMessage) => {
    switch (msg.type) {
      case 'assistant':
        if (msg.content.type !== 'assistant') return null;
        return (
          <div key={msg.id} className="flex gap-3 py-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{msg.content.text}</ReactMarkdown>
            </div>
          </div>
        );

      case 'user':
        if (msg.content.type !== 'user') return null;
        return (
          <div key={msg.id} className="flex gap-3 py-3 justify-end">
            <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg px-4 py-2">
              <p className="text-sm">{msg.content.text}</p>
            </div>
          </div>
        );

      case 'system':
        if (msg.content.type !== 'system') return null;
        return (
          <div key={msg.id} className="flex justify-center py-2">
            <Badge variant="secondary" className="gap-1">
              {msg.content.subtype === 'init' && <Sparkles className="h-3 w-3" />}
              {msg.content.subtype === 'completion' && <CheckCircle2 className="h-3 w-3" />}
              {msg.content.message || `Session ${msg.content.subtype}`}
            </Badge>
          </div>
        );

      case 'error':
        if (msg.content.type !== 'error') return null;
        return (
          <div key={msg.id} className="flex gap-3 py-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 text-sm text-destructive">
              <p className="font-medium">{msg.content.errorType}</p>
              <p>{msg.content.message}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Agent</h2>
          {isStreaming && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          )}
        </div>
        {isStreaming && (
          <Button variant="ghost" size="sm" onClick={cancelSession}>
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SKILLS.filter((name) =>
            skills.some((s) => s.name === name)
          ).map((skillName) => (
            <Button
              key={skillName}
              variant="outline"
              size="sm"
              onClick={() => handleRunSkill(skillName)}
              disabled={isStreaming}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              /{skillName}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Select a skill above or type a message to start
              </p>
            </div>
          ) : (
            <>
              {renderMessages()}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <Separator />

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || !!pendingPermission}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming || !!pendingPermission}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Permission Dialog */}
      <PermissionDialog
        permission={pendingPermission}
        onApprove={approvePermission}
        onDeny={denyPermission}
      />
    </div>
  );
}

export default AgentPanel;
