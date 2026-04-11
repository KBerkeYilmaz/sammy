#!/usr/bin/env bash
# PreToolUse hook for Edit/Write — blocks edits to sensitive files
# Reads JSON from stdin: { hook_event_name, tool_name, tool_input: { file_path } }
# Exit 2 = block, Exit 0 = allow

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

block() {
  echo "BLOCKED: Editing '$FILE_PATH' is not allowed — $1" >&2
  exit 2
}

# ── Environment files ────────────────────────────────────────────────────
echo "$FILE_PATH" | grep -qE '(^|/)\.env(\.|$|local|production|staging|test|development)' && block "environment files must not be edited by Claude"
echo "$FILE_PATH" | grep -qE '(^|/)\.env$' && block "environment files must not be edited by Claude"

# ── Certificates and private keys ────────────────────────────────────────
echo "$FILE_PATH" | grep -qE '\.(pem|key|cert|p12|pfx|crt|ca-bundle)$' && block "certificate/key files are protected"

# ── Lock files — use package manager instead ────────────────────────────
echo "$FILE_PATH" | grep -qE '(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lock(b)?)$' && block "lock files must not be directly edited — use the package manager"

# ── Hooks self-protection — prevent Claude from disabling safety hooks ──
echo "$FILE_PATH" | grep -qE '\.claude/hooks/' && block "hooks are protected from self-modification"

# ── Settings self-protection ─────────────────────────────────────────────
echo "$FILE_PATH" | grep -qE '\.claude/settings\.json$' && block "settings.json is protected from self-modification"

exit 0
