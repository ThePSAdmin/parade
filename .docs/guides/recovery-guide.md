# Recovery Guide

This guide helps you recover workflow state after interruptions, context loss, crashes, or failures.

## Quick Recovery

**Lost context mid-session?**
```bash
# See everything at once
/workflow-status

# Or manually check:
bd ready --json                    # What's ready to work on
bd list --status in_progress       # What's currently being worked on
```

---

## Checkpoint Commands

Use these commands to save/inspect workflow state at any time.

### Beads (Execution Phase)

```bash
# See what's ready to work on (no blockers)
bd ready --json

# See what's currently in progress
bd list --status in_progress --json

# See all tasks in a specific epic
bd list --parent customTaskTracker-abc --json

# See all open work
bd list --status open --json

# See blocked tasks
bd list --status blocked --json

# View full task details
bd show customTaskTracker-abc.1

# View dependency tree
bd dep tree customTaskTracker-abc --json
```

### Discovery DB (Pre-Execution Phase)

```bash
# Active briefs (not yet exported to beads)
sqlite3 discovery.db "SELECT id, title, status FROM briefs WHERE status != 'exported' ORDER BY created_at DESC;"

# Pending specs awaiting review
sqlite3 discovery.db "SELECT id, title, status FROM specs WHERE status = 'review' ORDER BY created_at DESC;"

# All discovery activity
sqlite3 discovery.db "SELECT brief_id, event_type, created_at FROM workflow_events ORDER BY created_at DESC LIMIT 20;"

# Interview progress
sqlite3 discovery.db "
SELECT
  b.title,
  COUNT(iq.id) as total_questions,
  SUM(CASE WHEN iq.answer IS NOT NULL THEN 1 ELSE 0 END) as answered
FROM briefs b
LEFT JOIN interview_questions iq ON b.id = iq.brief_id
WHERE b.status = 'in_discovery'
GROUP BY b.id, b.title;
"

# SME review status
sqlite3 discovery.db "
SELECT
  b.title,
  sr.agent_type,
  sr.created_at
FROM briefs b
JOIN sme_reviews sr ON b.id = sr.brief_id
WHERE b.status = 'in_discovery'
ORDER BY sr.created_at DESC;
"
```

---

## State Queries

### Combined View (Recommended)

```bash
# Use the workflow-status skill for comprehensive overview
/workflow-status
```

This shows:
- Active briefs in discovery
- Open epics and task counts
- Blocked tasks with reasons
- Recent activity
- Suggested next actions

### Discovery Phase Queries

```bash
# What stage is each brief in?
sqlite3 discovery.db "
SELECT
  id,
  title,
  status,
  datetime(created_at) as started,
  datetime(updated_at) as last_update
FROM briefs
ORDER BY created_at DESC;
"

# Detailed brief status
sqlite3 discovery.db "
SELECT
  b.id,
  b.title,
  b.status,
  COUNT(DISTINCT iq.id) as questions,
  COUNT(DISTINCT sr.id) as sme_reviews,
  COUNT(DISTINCT s.id) as specs
FROM briefs b
LEFT JOIN interview_questions iq ON b.id = iq.brief_id
LEFT JOIN sme_reviews sr ON b.id = sr.brief_id
LEFT JOIN specs s ON b.id = s.brief_id
GROUP BY b.id
ORDER BY b.created_at DESC;
"
```

### Execution Phase Queries

```bash
# Epic progress summary
bd list --json | jq '[.[] | select(.issue_type=="epic")] | .[] | {id, title, status, task_count: (.children // [] | length)}'

# Find stalled work (in_progress but no recent activity)
bd list --status in_progress --json | jq '.[] | {id, title, updated: .updated_at}'

# Dependency chains
bd list --json | jq '[.[] | select(.dependencies | length > 0)] | .[] | {id, title, blocks: [.dependencies[] | select(.dependency_type=="blocks") | .id]}'
```

---

## Resume Procedures

### After Context Loss

**Scenario:** Session ended abruptly, need to pick up where you left off.

```bash
# 1. Get full state
/workflow-status

# 2. Check what was in progress
bd list --status in_progress

# 3. Review recent git activity
git log --oneline --since="2 hours ago"

# 4. Check for uncommitted work
git status

# 5. Resume based on findings:
#    - If tasks are in_progress: Continue work or spawn new agent
#    - If nothing in_progress: Run `bd ready` to get next work
#    - If uncommitted changes: Commit or stash them
```

### After Crash

**Scenario:** System crashed during task execution.

```bash
# 1. Check filesystem state
git status
git log --oneline -5

# 2. Check beads state
bd list --status in_progress

# 3. Reconcile differences
#    - If git shows changes but beads task is 'open': The task was started but not marked in_progress
#    - If git is clean but beads shows 'in_progress': The task failed before committing
#    - If both show activity: Review git diff to determine progress

# 4. Decide action:
#    - Incomplete work: Continue or restart task
#    - Completed work not committed: Commit and close task
#    - Task failed: Mark blocked and create follow-up

# Example: Task was in_progress but failed
bd update customTaskTracker-abc.1 --status blocked
bd create "Debug issue from crash in task abc.1" --parent customTaskTracker-abc -t task
```

### After Failure

**Scenario:** Task completed but tests failed or verification failed.

```bash
# 1. Mark task as blocked
bd update customTaskTracker-abc.1 --status blocked

# 2. Create follow-up task
bd create "Fix failing tests from task abc.1" --parent customTaskTracker-abc -t task

# 3. Add dependency (new task blocks failed task)
bd dep add customTaskTracker-abc.2 customTaskTracker-abc.1

# 4. Work on fix
bd update customTaskTracker-abc.2 --status in_progress

# 5. After fix:
bd close customTaskTracker-abc.2
bd update customTaskTracker-abc.1 --status in_progress
# Re-run verification
bd close customTaskTracker-abc.1
```

---

## Common Scenarios

### Resume from Interrupted Discovery

**Symptom:** Brief exists but discovery incomplete.

```bash
# 1. Check brief status
sqlite3 discovery.db "SELECT id, title, status FROM briefs WHERE status != 'exported';"

# 2. Check interview progress
sqlite3 discovery.db "
SELECT
  iq.question,
  iq.answer IS NOT NULL as answered
FROM interview_questions iq
WHERE iq.brief_id = 'brief-xyz'
ORDER BY iq.created_at;
"

# 3. Resume discovery
/start-discovery brief-xyz

# OR if discovery was complete, just approve:
/approve-spec spec-xyz
```

### Resume from Interrupted Task Execution

**Symptom:** Epic exists, some tasks complete, some in_progress.

```bash
# 1. Check epic status
bd list --parent customTaskTracker-abc

# 2. Check what's ready
bd ready --json | jq '.[] | select(.parent == "customTaskTracker-abc")'

# 3. Check in_progress tasks
bd list --status in_progress --parent customTaskTracker-abc

# 4. Resume execution
/run-tasks customTaskTracker-abc

# OR manually spawn agent for specific task:
# (Spawn agent with task ID and let them read from beads)
```

### Handle Blocked Tasks

**Symptom:** Tasks marked as blocked, preventing progress.

```bash
# 1. Find blocked tasks
bd list --status blocked

# 2. Review why blocked
bd show customTaskTracker-abc.1
# (Check dependencies and description for blocker reason)

# 3. Resolve blocker:
#    - If dependency blocked it: Work on dependency first
#    - If external blocker: Create task to resolve it
#    - If incorrectly blocked: Update status

# 4. Unblock
bd update customTaskTracker-abc.1 --status open
# Then it will show up in `bd ready`
```

### Clean Up Stale Worktrees

**Symptom:** Old git worktrees from failed tasks still exist.

```bash
# 1. List all worktrees
git worktree list

# 2. Check beads status for corresponding tasks
# (If task is closed but worktree exists, it's stale)

# 3. Remove stale worktrees
git worktree remove /path/to/old/worktree

# 4. Prune worktree references
git worktree prune

# 5. Clean up remote branches if needed
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```

---

## Verification Checklist

After recovery, verify state is consistent:

- [ ] `git status` shows clean working directory OR expected WIP
- [ ] `bd list --status in_progress` matches actual work being done
- [ ] No orphaned worktrees: `git worktree list`
- [ ] All commits pushed: `git status` shows "up to date with origin"
- [ ] Discovery DB and beads are in sync (no duplicate work)

---

## Advanced: Manual State Repair

**Only use if automated recovery fails.**

### Reset Task Status

```bash
# If task stuck in wrong state:
bd update customTaskTracker-abc.1 --status open

# If task should be closed but isn't:
bd close customTaskTracker-abc.1
```

### Fix Discovery DB Corruption

```bash
# Export to JSON for backup
sqlite3 discovery.db ".mode json" ".output backup.json" "SELECT * FROM briefs;" ".quit"

# Manual update (example: mark brief as exported)
sqlite3 discovery.db "UPDATE briefs SET status='exported', exported_epic_id='customTaskTracker-abc' WHERE id='brief-xyz';"
```

### Force Epic Status Update

```bash
# If epic status doesn't reflect reality:
bd update customTaskTracker-abc --status in_progress

# Close epic (only when ALL tasks done):
bd close customTaskTracker-abc
```

---

## Prevention Tips

1. **Always use /workflow-status** before ending sessions
2. **Commit and push frequently** - don't leave work stranded locally
3. **Update beads status** as work progresses (open → in_progress → closed)
4. **Create follow-up tasks** before marking work complete
5. **Run `bd sync`** after git operations to keep metadata aligned

---

## Get Help

If recovery procedures don't work:

1. Run `bd doctor` to diagnose beads issues
2. Check `.beads/daemon.log` for error messages
3. Review `git reflog` to find lost commits
4. Ask for human help with context from `/workflow-status`
