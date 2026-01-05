#!/bin/bash
# Hook: Sync brief status when an epic is closed via bd close
#
# This hook is triggered after `bd close` commands and updates the
# corresponding brief in discovery.db to "completed" status.
#
# Usage: Called by Claude Code PostToolUse hook for Bash commands
# Input: Receives the command that was executed via stdin or args

set -e

# Get the command that was executed
COMMAND="$1"

# Only process bd close commands
if [[ ! "$COMMAND" =~ ^bd\ close ]]; then
    exit 0
fi

# Extract issue ID(s) from the command
# bd close <id> [<id2> ...] [--reason="..."]
ISSUE_IDS=$(echo "$COMMAND" | grep -oE '[a-zA-Z]+-[a-zA-Z0-9]+(\.[0-9]+)?' | head -10)

if [[ -z "$ISSUE_IDS" ]]; then
    exit 0
fi

# Find the project root (look for .beads directory)
PROJECT_ROOT="$(pwd)"
while [[ "$PROJECT_ROOT" != "/" ]]; do
    if [[ -d "$PROJECT_ROOT/.beads" ]]; then
        break
    fi
    PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

if [[ ! -d "$PROJECT_ROOT/.beads" ]]; then
    exit 0
fi

# Find discovery.db (check .parade/ first, then root)
if [[ -f "$PROJECT_ROOT/.parade/discovery.db" ]]; then
    DISCOVERY_DB="$PROJECT_ROOT/.parade/discovery.db"
elif [[ -f "$PROJECT_ROOT/discovery.db" ]]; then
    DISCOVERY_DB="$PROJECT_ROOT/discovery.db"
else
    exit 0
fi

# Process each issue ID
for ISSUE_ID in $ISSUE_IDS; do
    # Check if this is an epic (no dot in ID means it's a parent issue)
    if [[ ! "$ISSUE_ID" =~ \. ]]; then
        # This could be an epic - check if it has a corresponding brief
        # Update the brief status to completed
        sqlite3 "$DISCOVERY_DB" "UPDATE briefs SET status = 'completed', updated_at = datetime('now') WHERE exported_epic_id = '$ISSUE_ID' AND status = 'exported';" 2>/dev/null || true

        # Log if a brief was updated
        UPDATED=$(sqlite3 "$DISCOVERY_DB" "SELECT changes();" 2>/dev/null || echo "0")
        if [[ "$UPDATED" -gt 0 ]]; then
            echo "Synced brief status to 'completed' for epic: $ISSUE_ID"
        fi
    fi
done
