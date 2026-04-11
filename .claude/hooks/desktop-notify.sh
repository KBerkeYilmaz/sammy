#!/usr/bin/env bash
# Notification hook — sends macOS desktop notification when Claude finishes

INPUT=$(cat)

MESSAGE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('message', 'Claude Code finished a task'))
except:
    print('Claude Code finished a task')
" 2>/dev/null || echo "Claude Code finished a task")

osascript -e "display notification \"$MESSAGE\" with title \"Forge / Claude Code\"" 2>/dev/null || true

exit 0
