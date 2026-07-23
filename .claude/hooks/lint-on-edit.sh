#!/bin/bash
# Lint-on-edit for LockIn (PostToolUse: Edit|Write|MultiEdit).
# After a JS file is written, auto-fix what eslint can and surface anything that
# remains (exit 2 feeds stderr back to Claude; the turn continues) so it gets
# cleaned up in the same turn. Never blocks on its own failure.

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only lint JavaScript source.
case "$FILE" in
  *.js|*.jsx|*.mjs) ;;
  *) exit 0 ;;
esac

# Skip generated / vendored paths.
case "$FILE" in
  *node_modules/*|*/.next/*|*/coverage/*|*/dist/*) exit 0 ;;
esac

[ -f "$FILE" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# Auto-fix in place; capture anything eslint can't fix.
OUT=$(npx --no-install eslint --fix "$FILE" 2>&1)
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  printf 'eslint flagged %s:\n%s\nFix these before continuing.\n' "$FILE" "$OUT" >&2
  exit 2
fi

exit 0
