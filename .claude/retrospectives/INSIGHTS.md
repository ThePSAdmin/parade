# Workflow Insights

> Accumulated learnings from epic retrospectives. Updated after each `/retro` run.
> This file tracks patterns, optimizations, and metrics to continuously improve workflow efficiency.

---

## Token Efficiency Wins

Patterns and practices that reduce token usage:

- **Single-file task bundling**: When multiple tasks target same file, coordinate as batch instead of parallel agents (avoids merge conflicts, saves ~30% tokens)
- **Skip discovery for pre-analyzed work**: Direct spec creation when analysis already complete
- **Documentation tasks skip TDD**: No test overhead for non-code changes

<!--
Example entries:
- **Agent prompts under 500 tokens**: 30% faster execution
- **Explicit acceptance criteria**: Reduces debug loops by 40%
- **TDD for typescript**: Catches 80% of issues before debug phase
- **Minimal context spawning**: Agents read from beads, not orchestrator prompts
-->

---

## Common Failure Patterns

| Pattern | Frequency | Prevention |
|---------|-----------|------------|
| *(No entries yet)* | - | - |

<!--
Example entries:
| State binding (SwiftUI) | 5 epics | Added to swift-agent prompt |
| Null checks (TypeScript) | 3 epics | Added to typescript checklist |
| RLS policy errors | 2 epics | Added verification step |
| Missing type imports | 4 epics | Pre-flight import check |
-->

---

## Workflow Optimizations Applied

Checklist of improvements made based on retrospective learnings:

- [x] Added Test Protocol section to CLAUDE.md (TDD workflow)
- [x] Added Context Management section (token efficiency via /clear)
- [x] Added Thinking Depth triggers (ultrathink for complex decisions)
- [x] Added review-agent to Agent Types (multi-Claude verification)
- [x] Enhanced Sub-Agent Prompt Template (specific constraints)
- [x] Added Code Style section (TypeScript conventions)
- [x] Added Agent Selection guidance (haiku/sonnet/opus by complexity)
- [x] Added Git Protocol section (commit conventions)
- [ ] Consider adding `agent:docs` label for documentation-only tasks

<!--
Example entries:
- [x] Reduced debug max_iterations: 10 -> 8 (patterns documented)
- [x] Added pre-flight checks for common issues
- [x] Parallel batch threshold: 2 -> 3 tasks (reduced overhead)
- [x] Added TypeScript strict null checks to agent prompts
- [ ] Consider adding integration test step after batch completion
-->

---

## Metrics Over Time

| Epic | Tasks | Debug Loops | Tokens (est) | Efficiency Score |
|------|-------|-------------|--------------|------------------|
| customTaskTracker-5pt | 9 | 0 | ~8K | Baseline (11/10) |
| customTaskTracker-2go | 7 | 0 | ~6K | 11/10 (perfect) |
| customTaskTracker-46j | 20 | 0 | ~15K | 11/10 (perfect) |

<!--
Example entries:
| bd-a1b2 | 4 | 3 | 35K | Baseline |
| bd-c3d4 | 5 | 2 | 28K | +20% |
| bd-x7y8 | 5 | 1 | 22K | +37% |
| bd-e5f6 | 6 | 0 | 18K | +48% |

Efficiency Score = improvement vs baseline (first measured epic)
Formula: ((baseline_tokens - current_tokens) / baseline_tokens) * 100
-->

---

## Agent Performance Trends

Track success rates by agent type to identify which need prompt improvements.

| Agent | Total Tasks | Successes | Failures | Success Rate | Avg Attempts |
|-------|-------------|-----------|----------|--------------|--------------|
| typescript-agent | 33 | 33 | 0 | 100% | 1.0 |
| test-agent | 3 | 3 | 0 | 100% | 1.0 |

<!--
Example entries:
| swift-agent | 12 | 10 | 2 | 83% | 1.2 |
| typescript-agent | 18 | 15 | 3 | 83% | 1.3 |
| sql-agent | 8 | 8 | 0 | 100% | 1.0 |
| test-agent | 6 | 5 | 1 | 83% | 1.1 |

Notes:
- Agents below 80% success rate should have prompts reviewed
- High avg attempts (>1.5) indicates unclear acceptance criteria or missing patterns
-->

---

## Appendix: How to Update This File

This file is updated by the `/retro` skill after each epic retrospective:

1. **Token Efficiency Wins**: Add new patterns discovered that saved tokens
2. **Common Failure Patterns**: Increment frequency or add new patterns
3. **Workflow Optimizations**: Check off applied optimizations, add new ideas
4. **Metrics Over Time**: Append new row with epic metrics
5. **Agent Performance**: Update running totals for each agent type

### Efficiency Score Calculation

```
efficiency_score = ((baseline_tokens - current_tokens) / baseline_tokens) * 100
```

- First epic with metrics becomes the "Baseline"
- Positive scores indicate improvement
- Target: Continuous improvement trending toward +50% or better

### Files Updated by Retrospectives

- `.claude/debug-knowledge/*.md` - New debugging patterns
- `.claude/agents/*.md` - Agent prompt improvements
- `project.yaml` - Workflow configuration tweaks
- This file - Accumulated insights

---

*Last updated: 2026-01-17 (customTaskTracker-46j retrospective)*
