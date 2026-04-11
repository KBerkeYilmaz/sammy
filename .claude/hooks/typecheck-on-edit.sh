#!/usr/bin/env bash
# PostToolUse hook for Edit/Write — runs tsc after TypeScript file changes
# Reads JSON from stdin: { tool_name, tool_input: { file_path } }

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only run for TypeScript/TSX files
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Skip test/spec files
if [[ "$FILE_PATH" == *.test.ts || "$FILE_PATH" == *.test.tsx || "$FILE_PATH" == *.spec.ts ]]; then
  exit 0
fi

# Run typecheck from project root
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

if ! pnpm typecheck 2>&1; then
  echo "TypeScript errors found — fix before proceeding" >&2
  exit 2
fi

exit 0
