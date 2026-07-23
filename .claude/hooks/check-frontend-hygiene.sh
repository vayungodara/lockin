#!/bin/bash
# Frontend hygiene guardrail for LockIn (PreToolUse: Edit|Write|MultiEdit).
# Inspects the text about to be written to a JS file and:
#   - BLOCKS canvas-confetti imports  -> use lib/confetti.js (pure DOM); canvas-confetti broke prod
#   - BLOCKS debugger statements      -> never ship a breakpoint
#   - WARNS on console.log/debug      -> source is kept at zero; strip before shipping
# Matches the JSON-output style of check-destructive.sh. No `set -e` — unconditional
# greps would trip it on a clean (no-match) file.

INPUT=$(cat)

FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only police JavaScript source.
case "$FILE" in
  *.js|*.jsx|*.mjs) ;;
  *) exit 0 ;;
esac

# Text being written: Write(content), Edit(new_string), MultiEdit(edits[].new_string).
NEW=$(printf '%s' "$INPUT" | jq -r '
  [ .tool_input.content,
    .tool_input.new_string,
    ( .tool_input.edits // [] | .[].new_string )
  ] | map(select(. != null)) | join("\n")
')

[ -z "$NEW" ] && exit 0

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[hygiene] %s"}}' "$1"
  exit 0
}

# Hard block: canvas-confetti import (static or require).
if printf '%s' "$NEW" | grep -qE "(import|require).*['\"]canvas-confetti['\"]"; then
  deny "canvas-confetti is banned (it broke production) — use lib/confetti.js instead"
fi

# Hard block: a debugger statement (line ending in debugger / debugger;, optional trailing comment).
if printf '%s' "$NEW" | grep -qE '(^|[^A-Za-z0-9_$.])debugger[[:space:]]*;?[[:space:]]*(//.*)?$'; then
  deny "remove the debugger statement before writing"
fi

# Soft warn (non-blocking): console.log / console.debug.
if printf '%s' "$NEW" | grep -qE 'console\.(log|debug)[[:space:]]*\('; then
  printf '{"systemMessage":"[hygiene] console.log/debug added to %s — strip debug logging before shipping (source is currently at zero)."}' "$FILE"
  exit 0
fi

exit 0
