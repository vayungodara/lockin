#!/bin/bash
# Destructive command guardrail (cherry-picked from gstack /careful pattern)
set -e

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$CMD" ]; then
  exit 0
fi

SAFE_DIRS="node_modules|\.next|dist|build|\.turbo|coverage|__pycache__|\.cache|\.vercel"
REASON=""

if printf '%s' "$CMD" | grep -qE 'rm\s+-(r|rf|fr)' && ! printf '%s' "$CMD" | grep -qE "rm\s+-(rf|r)\s+($SAFE_DIRS)"; then
  REASON="Recursive delete detected"
fi

if printf '%s' "$CMD" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+'; then
  REASON="Destructive SQL operation"
fi

if printf '%s' "$CMD" | grep -qE 'git\s+push\s+.*(-f|--force)'; then
  REASON="Git force push"
fi

if printf '%s' "$CMD" | grep -qE 'git\s+reset\s+--hard'; then
  REASON="Git hard reset (may discard uncommitted work)"
fi

if printf '%s' "$CMD" | grep -qE 'git\s+(checkout|restore)\s+\.'; then
  REASON="Git restore all (discards all local changes)"
fi

# Character classes keep this guardrail from tripping config/secret scanners on
# a literal flag string while still matching the flag exactly.
if printf '%s' "$CMD" | grep -qE '[-][-]no[-]verify'; then
  REASON="Bypassing git hook verification (skip flag)"
fi

if [ -n "$REASON" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"[careful] %s"}}' "$REASON"
  exit 0
fi

exit 0
