# Technical Review: Pipeline Workflow Integration

**Brief ID:** pipeline-workflow-integration
**Review Date:** 2026-01-17
**Reviewer:** Technical SME

---

## Executive Summary

The pipeline-workflow-integration brief proposes embedding the full Parade workflow (discover → approve-spec → run-tasks → retro) directly into the Pipeline UI. The proposal is **technically feasible** with **moderate complexity** and several architectural considerations around WebSocket session management, long-running discovery conversations, and real-time progress tracking.

**Risk Level:** MEDIUM
**Estimated Scope:** Substantial (6-8 weeks for full implementation)

---

## 1. Technical Risks & Constraints

### 1.1 WebSocket Session Management (HIGH RISK)

**Constraint:** Long-running discovery Q&A conversations in modal dialogs could exceed WebSocket session timeouts.

**Details:**
- Current WebSocket client (`src/renderer/lib/api/websocket.ts`) has automatic reconnection with exponential backoff (max 10 attempts, 30s max delay)
- Claude Agent SDK sessions can run for extended periods (discovery interviews may take 5-30 minutes)
- If WebSocket disconnects mid-discovery, the SDK session continues server-side but client loses real-time message stream
- File watcher events (beads changes) trigger `onDiscoveryChange` which could race with active discovery session

**Specific Issue:**
```typescript
// websocket.ts lines 94-116
// Reconnect after 10 failed attempts stops - discovery modal would appear frozen
if (this.reconnectAttempts >= this.maxReconnectAttempts) {
  console.log('Max reconnect attempts reached, giving up');
  return; // ❌ Discovery modal would be stuck
}
```

**Recommendation:**
- Increase `maxReconnectAttempts` from 10 to 30+ for discovery-heavy workflows
- Implement "reconnect and resume" logic using SDK's `resumeSessionId` (already captured in `claudeAgentService.ts` line 412)
- Add heartbeat/ping mechanism (WebSocket has no built-in timeout)
- Show reconnection status in modal UI

### 1.2 Discovery Modal State Isolation (MEDIUM RISK)

**Constraint:** Discovery questions/answers must not interfere with existing agent panel sessions.

**Details:**
- Current `agentStore.ts` has single `activeSessionId` and single `messages` array
- Opening discovery modal while agent panel is running creates session conflict
- Both the modal and agent panel would compete for the same `activeSessionId`

**Current Pattern Problem:**
```typescript
// agentStore.ts lines 117-133
setActiveSession: (sessionId) => {
  set({ activeSessionId: sessionId, messages: [], pendingPermission: null });
  // ❌ Switching sessions clears messages - discovery modal can't
  // coexist with other active sessions
}
```

**Recommendation:**
- Create isolated session context: `discoverySessionId` separate from `activeSessionId`
- Add session type tagging: `{ sessionId, type: 'discovery' | 'general' }`
- Modify WebSocket message routing to support multiple concurrent session streams
- Keep discovery modal independent from agent panel state

### 1.3 Modal Dialog Lifecycle & Cleanup (MEDIUM RISK)

**Constraint:** Discovery modal requires cleanup of long-running async operations on cancel/unmount.

**Details:**
- Radix UI Dialog primitives in `src/renderer/components/ui/dialog.tsx` provide no special cleanup hooks
- If user closes discovery modal while agent session is running, session continues server-side but loses client listeners
- No mechanism to "resume" a discovery session if user accidentally closes modal

**Recommendation:**
- Implement session persistence: save `sdkSessionId` to localStorage (keyed by brief_id)
- Add "Resume Discovery" option if modal is reopened for same brief
- Implement AbortController chain: discovery modal's AbortController tied to session cancel
- Add confirmation dialog before closing modal with active discovery

---

## 2. Architecture Approach for Modal-Based Discovery Flow

### 2.1 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PipelineBoard                                               │
│  + Column with "Add Feature" button                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Discovery Modal (NEW)                                 │ │
│  │  1. Capture feature description                       │ │
│  │  2. Full-screen Q&A conversation (discoverySessionId) │ │
│  │  3. Show spec review in sidebar                       │ │
│  │  4. Export to beads                                   │ │
│  │                                                       │ │
│  │  State: discoverySessionId, discoveryMessages, spec  │ │
│  │  → Isolated from agentStore.activeSessionId          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Project context flows through discoveryStore +            │
│  beadsStore (activeProjectId)                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 New Store: `discoveryWorkflowStore`

Create a **dedicated Zustand store** for modal-based discovery:

```typescript
// src/renderer/store/discoveryWorkflowStore.ts

interface DiscoveryWorkflowState {
  // Modal state
  isOpen: boolean;
  step: 'description' | 'discovery' | 'spec_review' | 'confirmation';

  // Session state (isolated from agentStore)
  discoverySessionId: string | null;
  discoveryMessages: AgentMessage[];
  featureDescription: string;
  spec: Spec | null;

  // Project context
  briefId: string | null;
  activeProjectPath: string | null;

  // Progress tracking
  isDiscoveryRunning: boolean;
  discoveryError: string | null;

  // Resumable session tracking
  savedSdkSessionId: string | null; // For reconnect/resume

  // Actions
  openModal: (projectPath: string) => void;
  closeModal: () => void;
  startDiscovery: (description: string) => void;
  continueDiscovery: (message: string) => void;
  cancelDiscovery: () => void;
  confirmExport: () => void;
}
```

### 2.3 Modal Component Structure

```
DiscoveryWorkflowModal
├── Step 1: FeatureDescriptionForm
│   └── TextArea + "Start Discovery" button
├── Step 2: DiscoveryQandA (full-screen conversation)
│   ├── Messages scroll area
│   ├── Input field (with slash command support)
│   └── Cancel button
├── Step 3: SpecReview (sidebar pattern)
│   ├── Generated spec preview
│   ├── Approval criteria
│   └── "Approve" / "Revise" buttons
└── Step 4: ConfirmationDialog
    ├── Show exported epic ID
    ├── "Create Tasks" option (auto-trigger run-tasks)
    └── "Done" button
```

### 2.4 WebSocket Session Routing

Modify `websocket.ts` to support multiple concurrent sessions:

```typescript
// Current (problematic):
onAgentMessage(callback: AgentMessageCallback) // Single stream

// Proposed:
interface SessionStreamRouter {
  routeMessage(sessionId: string, message: AgentMessage): void;
  register(sessionId: string, type: 'discovery' | 'general'): void;
  unregister(sessionId: string): void;
}
```

**Implementation detail:**
- Discovery modal registers session as `type: 'discovery'`
- Agent panel uses `type: 'general'`
- Router determines which store to update based on session type
- Both can stream simultaneously without interference

---

## 3. WebSocket Session Management During Discovery

### 3.1 Reconnection Strategy

**Problem:** Discovery modal could block for 2-3 minutes if network is unstable.

**Solution: Graceful Degradation**

```typescript
// discoveryWorkflowStore action

startDiscovery: async (description: string) => {
  const sessionId = await wsClient.runSkill('discover', description);

  // Save SDK session ID for recovery
  const recoveryKey = `discovery-session-${briefId}`;
  localStorage.setItem(recoveryKey, sessionId);

  set({ discoverySessionId: sessionId, isDiscoveryRunning: true });
},

// On WebSocket reconnect:
private onReconnect() {
  const sessionId = get().discoverySessionId;
  if (sessionId && wsClient.isSessionActive(sessionId)) {
    // Session still active server-side, resume
    wsClient.resumeSession(sessionId, savedSdkSessionId);
  } else {
    // Session lost, offer resume option
    showToast('Discovery session interrupted. Resume?');
  }
}
```

### 3.2 Heartbeat Implementation

Add optional heartbeat to keep WebSocket alive:

```typescript
// websocket.ts

private startHeartbeat() {
  this.heartbeatTimer = setInterval(() => {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000); // 30 second ping
}

private onHeartbeatPong() {
  // Reset timeout
  this.resetReconnectAttempts();
}
```

### 3.3 Session State Persistence

Store resilient session info in IndexedDB (not localStorage due to size limits for long conversations):

```typescript
// discoveryStore.ts

async saveDiscoverySession(briefId: string, session: {
  sdkSessionId: string;
  messages: AgentMessage[];
  featureDescription: string;
  timestamp: number;
}) {
  // Save to IndexedDB with brief_id as key
  // Auto-restore on modal reopen
}
```

---

## 4. Active Agent Count Badge & Progress Indicators

### 4.1 Current Progress Calculation

**Existing Pattern:**
```typescript
// batchComputation.ts lines 79-85
export function computeProgress(tasks: Issue[]): Batch['progress'] {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'closed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}
```

This works for **task progress** but not for **agent count**.

### 4.2 Tracking Active Agents

**Proposal: Agent Label Aggregation**

```typescript
// New utility: batchComputation.ts

export function countActiveAgents(batch: Batch): number {
  const activeAgents = new Set<string>();

  for (const task of batch.tasks) {
    // Only count in_progress tasks
    if (task.status !== 'in_progress') continue;

    // Extract agent type from labels
    const agentLabel = task.labels?.find(l => l.startsWith('agent:'));
    if (agentLabel) {
      activeAgents.add(agentLabel);
    }
  }

  return activeAgents.size;
}

// Usage in batch header:
const activeCount = countActiveAgents(batch);
if (activeCount > 0) {
  renderBadge(`${activeCount} agents`, 'pulsing-glow');
}
```

### 4.3 Visual Indicators: Pulsing Glow

Use CSS animations + Tailwind for pulsing effect:

```tsx
// components/ui/badge.tsx
const Badge = ({ variant = 'default', pulse = false }) => (
  <span className={cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    variant === 'default' && "bg-blue-100 text-blue-800",
    pulse && "animate-pulse shadow-lg shadow-blue-500/50"
  )}>
    {children}
  </span>
);

// In batch header:
<Badge variant="default" pulse={isActive}>
  {activeCount} {activeCount === 1 ? 'Agent' : 'Agents'}
</Badge>
```

### 4.4 Real-Time Agent Tracking

Hook into file watcher events:

```typescript
// beadsStore.ts subscribeToChanges()

// When tasks are fetched, recompute agent badges
computeBatchesForEpic(epicId);
// ✓ This already recalculates progress, just add agent count
```

**No new architecture needed** - leverage existing batch computation that already runs on file watcher events.

### 4.5 Agent Count Display Locations

1. **Batch Header** (primary):
   - `<BatchHeader batch={batch} activeAgents={countActiveAgents(batch)} />`

2. **Pipeline Card** (secondary, for "In Progress" column):
   - Show small badge on brief card when execution active
   - Aggregate count: sum of all batch agents

3. **Sidebar Progress** (tertiary):
   - "3 agents running • Batch 2/5"

---

## 5. Auto-Triggering Retro on Epic Completion

### 5.1 Retro Trigger Points

**Question:** When should retro auto-trigger?

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| **Auto on last task close** | Immediate insights | User might want manual check first |
| **User clicks "Complete Epic"** | Explicit, controlled | Requires manual action |
| **Modal prompt after epic status → closed** | Non-intrusive UX | Easy to dismiss |
| **Background job with notification** | Doesn't block UI | Decouples from execution flow |

**Recommendation:** Hybrid approach

```typescript
// beadsStore.ts

updateIssueStatus: async (id, status) => {
  // ... existing logic ...

  // Check if all tasks in epic are closed
  const epic = findParentEpic(id);
  if (epic && allTasksClosed(epic)) {
    // Show toast: "All tasks complete! Run retro?"
    showRetroPrompt(epic.id);
  }
}
```

### 5.2 Retro Session Creation

The `/retro` skill already exists. Trigger it via agent service:

```typescript
// discoveryWorkflowStore or new retroStore

async triggerRetro(epicId: string) {
  const sessionId = await wsClient.runSkill('retro', epicId);
  // Open full-screen retro modal with same Q&A pattern as discovery
}
```

**Architectural Pattern:**
- Retro is just another skill invocation
- Reuse discovery modal pattern: full-screen Q&A
- Show suggestions in sidebar-like panel
- "Approve suggestions" triggers retrospective.db write

### 5.3 Retro Execution Flow

```
Epic completion detected
  ↓
Show toast: "All tasks complete! Review insights?"
  ↓
User clicks "Run Retro"
  ↓
retroSessionId = await runSkill('retro', epicId)
  ↓
Open full-screen RetroModal
  - Show agent messages
  - Display suggestions (with checkboxes)
  - Show efficiency metrics
  ↓
User "Approves" suggestions
  ↓
Write to retrospective.db
  ↓
"Insights saved!"
```

### 5.4 Concerns & Mitigations

**Concern:** Retro could be long-running (10-30 min for large epics)

**Mitigation:**
- Telemetry service (`src/main/services/telemetry.ts`) could estimate duration based on task count
- Show progress indicator: "Analyzing 15 tasks... (2/3 complete)"
- Allow user to close modal and resume retro later

**Concern:** Retro runs after destructive operations (epic close)

**Mitigation:**
- Don't auto-close retro modal on completion
- Require explicit "Save & Close" button
- If user closes without saving, offer "Save Retrospective" in toast

---

## 6. Detailed Implementation Checklist

### Phase 1: WebSocket Session Isolation (Week 1-2)

- [ ] Create `discoveryWorkflowStore` with isolated session tracking
- [ ] Modify `wsClient` to support session type routing
- [ ] Implement heartbeat/ping mechanism
- [ ] Add localStorage recovery for brief resume

**Test cases:**
- Open discovery modal, break network, verify auto-resume
- Open discovery modal while agent panel active, verify no cross-talk
- Close discovery modal mid-session, verify session persists server-side

### Phase 2: Discovery Modal UI (Week 2-3)

- [ ] Create `DiscoveryWorkflowModal` component with 4-step flow
- [ ] Implement `FeatureDescriptionForm` (textarea + submit)
- [ ] Implement `DiscoveryQandA` full-screen conversation
- [ ] Add "Cancel with confirmation" dialog
- [ ] Wire up store actions to WebSocket

**Test cases:**
- Type feature description, click "Start" → discovery questions appear
- Type answer, click "Send" → next question appears
- Network disconnects → auto-reconnect shows toast
- Close modal mid-discovery → resume option shows

### Phase 3: Spec Review & Export (Week 3-4)

- [ ] Integrate sidebar spec display (reuse from existing spec review)
- [ ] Add "Approve Spec" → export to beads
- [ ] Create confirmation dialog showing exported epic ID
- [ ] Option to auto-trigger `/run-tasks` (or allow manual)

**Test cases:**
- Spec approved → brief status changed to "exported"
- Epic created in beads with all tasks
- Can view exported epic in Kanban board

### Phase 4: Progress Indicators & Agent Badge (Week 4-5)

- [ ] Implement `countActiveAgents()` utility
- [ ] Add pulsing glow CSS animation
- [ ] Display badge in batch header
- [ ] Hook into file watcher updates for real-time refresh

**Test cases:**
- Start executing batch → agent badge appears with count
- Complete task → agent count decreases
- Pulsing effect visible during active execution

### Phase 5: Retro Integration (Week 5-6)

- [ ] Create `RetroModal` (reuse discovery modal pattern)
- [ ] Implement retro trigger on epic completion
- [ ] Show suggestions with checkboxes
- [ ] Write retrospective data to discovery.db

**Test cases:**
- Last task completes → retro prompt shows
- User clicks "Run Retro" → full-screen modal opens
- Approve suggestions → saved to retrospective.db

### Phase 6: Polish & Edge Cases (Week 6-8)

- [ ] Add comprehensive error handling
- [ ] Test with large epics (50+ tasks)
- [ ] Network reliability testing (packet loss, high latency)
- [ ] Accessibility review (keyboard nav, screen readers)
- [ ] Performance profiling (memory usage during long conversations)

---

## 7. Code Examples & Patterns

### 7.1 Reconnection & Resume Pattern

```typescript
// claudeAgentService.ts - already has resume support
async continue(sessionId: string, message: string): Promise<void> {
  const state = this.sessions.get(sessionId);

  if (!state.sdkSessionId) {
    throw new Error('Cannot resume: SDK session ID not available');
  }

  // Resume using SDK's conversation ID
  this.runQuery(sessionId, message, state.sdkSessionId);
}
```

**This is already implemented!** Just need to:
1. Preserve `sdkSessionId` in local store
2. Retry `continue()` on reconnect instead of error

### 7.2 Session Type Routing

```typescript
// websocket.ts - modify handleAgentMessage

private handleAgentMessage(ws: WebSocket, data: AgentServerMessage) {
  const { sessionId, message } = data;

  // Route based on session type
  const sessionType = this.getSessionType(sessionId);

  switch (sessionType) {
    case 'discovery':
      discoveryWorkflowStore.addMessage(sessionId, message);
      break;
    case 'general':
      useAgentStore.addMessage(sessionId, message);
      break;
  }
}

private sessionTypeMap = new Map<string, 'discovery' | 'general'>();

registerSession(sessionId: string, type: 'discovery' | 'general') {
  this.sessionTypeMap.set(sessionId, type);
}
```

### 7.3 Agent Count Calculation

```typescript
// batchComputation.ts - add new export

export function getAgentCountByBatch(batch: Batch): Record<string, string[]> {
  const agentsByType: Record<string, string[]> = {};

  for (const task of batch.tasks) {
    if (task.status !== 'in_progress') continue;

    const labels = task.labels || [];
    for (const label of labels) {
      if (label.startsWith('agent:')) {
        const agentType = label.replace('agent:', '');
        if (!agentsByType[agentType]) {
          agentsByType[agentType] = [];
        }
        agentsByType[agentType].push(task.id);
      }
    }
  }

  return agentsByType;
}

// Usage:
const agents = getAgentCountByBatch(batch);
const totalCount = Object.values(agents).flat().length;
```

---

## 8. Performance Considerations

### 8.1 Memory Usage

**Discovery Conversations:**
- Average discovery session: 30-50 messages
- Each message: ~1KB text + metadata
- 50 messages = ~50KB per session
- Concurrent sessions: typically 1-2, max 5
- Estimated memory: <1MB per active discovery

**Risk:** None. Memory usage acceptable.

### 8.2 WebSocket Payload Size

**Current:** Messages streamed as individual JSON objects
**Risk:** Large messages could cause lag

**Mitigation:**
- Messages already chunked by SDK streaming
- No batching needed
- Monitor with DevTools Network tab during testing

### 8.3 File Watcher Churn

**Current:** `beadsStore.subscribeToChanges()` debounces with 500ms (line 556)

**Risk:** Discovery modal opens while file watcher is processing

**Mitigation:**
- Already handled by Zustand state isolation
- No cross-pollution of discovery state

---

## 9. Feasibility Assessment

### 9.1 Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Radix UI Dialog | ✓ Installed | None - already in use |
| WebSocket reconnect | ✓ Implemented | Medium - needs enhancement |
| SDK resume support | ✓ Implemented | None - already coded |
| Zustand stores | ✓ Pattern known | None - established pattern |
| File watcher | ✓ Implemented | None - isolated impact |

**Conclusion:** All dependencies exist or are established patterns.

### 9.2 Scope Estimate

| Component | Complexity | Days | Risk |
|-----------|-----------|------|------|
| discoveryWorkflowStore | Low | 2 | Low |
| WebSocket session routing | Medium | 3 | Medium |
| Modal 4-step UI | Medium | 5 | Low |
| Spec integration | Low | 2 | Low |
| Agent badge & progress | Low | 2 | Low |
| Retro integration | Low | 2 | Low |
| Testing & polish | Medium | 5 | Low |
| **Total** | - | **21 days** | - |

**Realistic timeline:** 5-6 weeks with thorough testing and QA

### 9.3 What Could Go Wrong

| Scenario | Likelihood | Impact | Mitigation |
|----------|-----------|--------|-----------|
| WebSocket drops during discovery | Medium | High | Reconnect + resume logic |
| Modal doesn't cleanup on unmount | Low | Medium | useEffect cleanup |
| Memory leak in long conversations | Low | Medium | IndexedDB cleanup, session expiry |
| Race condition: discovery + file watcher | Low | Low | Isolated store, state guards |
| Network latency kills UX | Medium | Medium | Heartbeat, better toast messages |

---

## 10. Recommendations

### Priority 1: Must Do

1. **Implement WebSocket session type routing** - Required for safety
   - Prevents cross-talk between discovery and agent panel
   - Enables concurrent sessions

2. **Create discoveryWorkflowStore** - Foundation for modal
   - Isolated state management
   - Separate from agentStore

3. **Add heartbeat/ping mechanism** - Stability
   - Keeps connection alive during long discovery
   - Early detection of network issues

### Priority 2: Should Do

4. **Implement graceful reconnection with resume** - UX improvement
   - Users can recover from network drops
   - Uses existing SDK resumeSessionId support

5. **Add agent badge with count** - Visibility
   - Shows execution progress at a glance
   - Reuses existing batch computation

6. **Create discovery modal with 4-step flow** - Core feature
   - Familiar pattern (mirrors existing spec review)
   - Builds on established component patterns

### Priority 3: Nice to Have

7. **Auto-trigger retro on epic completion** - Convenience
   - Reduces manual workflow steps
   - Can be added incrementally

8. **IndexedDB session persistence** - Resilience
   - Allows recovery from browser restarts
   - Not critical for MVP

---

## 11. Questions for Stakeholder Clarification

1. **Retro auto-trigger behavior:**
   - Auto-open modal with suggestions?
   - Just show toast with "Run Retro" button?
   - Background job without interruption?

2. **Discovery modal interaction:**
   - Should discovery modal overlay on top of full pipeline?
   - Or replace pipeline view entirely during discovery?

3. **Concurrent discovery sessions:**
   - Can user open 2 discovery modals for different briefs?
   - Or only one active discovery at a time?

4. **Task creation from discovery:**
   - Auto-trigger `/run-tasks` after spec approved?
   - Or just create epic and let user start manually?

5. **Progress visibility:**
   - Where should agent count badge appear?
   - Just batch headers, or also on pipeline cards?

---

## Summary: Risk vs. Value

**Technical Risk:** MEDIUM
- WebSocket management is solvable with existing patterns
- Long-running conversations are well-understood in Claude Agent SDK
- No architectural blockers

**Implementation Risk:** LOW
- All components are established patterns in codebase
- No new dependencies needed
- Testing is straightforward

**User Value:** HIGH
- Unified workflow without context switching
- Real-time feedback on agent progress
- Automatic insights from retro

**Recommendation:** PROCEED with Phase 1-2 implementation as proof of concept, then gather stakeholder feedback before Phases 3-5.

