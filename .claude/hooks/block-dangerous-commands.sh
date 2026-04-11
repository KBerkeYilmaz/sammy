#!/usr/bin/env bash
# PreToolUse hook for Bash — blocks dangerous shell commands
# Reads JSON from stdin: { hook_event_name, tool_name, tool_input: { command } }
# Exit 2 = block, Exit 0 = allow

set -euo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = data.get('tool_input', {}).get('command', '')
    print(cmd)
except:
    print('')
" 2>/dev/null)

CMD_LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')

block() {
  echo "BLOCKED: $1" >&2
  exit 2
}

# ── Database destructive operations ─────────────────────────────────────
echo "$CMD_LOWER" | grep -qiE '\bdrop\s+(table|database|schema)\b' && block "DROP TABLE/DATABASE/SCHEMA is not allowed"
echo "$CMD_LOWER" | grep -qiE '\btruncate\b' && block "TRUNCATE is not allowed"

# DELETE without WHERE clause
if echo "$CMD_LOWER" | grep -qiE '\bdelete\s+from\b'; then
  echo "$CMD_LOWER" | grep -qiE '\bwhere\b' || block "DELETE without WHERE clause is not allowed"
fi

# UPDATE without WHERE clause
if echo "$CMD_LOWER" | grep -qiE '\bupdate\b.+\bset\b'; then
  echo "$CMD_LOWER" | grep -qiE '\bwhere\b' || block "UPDATE without WHERE clause is not allowed"
fi

# ── System destructive operations ────────────────────────────────────────
echo "$CMD_LOWER" | grep -qiE '\brm\s+(-rf|-fr|-r\s+-f)\s+(/|~|\.(/|$))' && block "rm -rf of root/home/cwd is not allowed"
echo "$CMD_LOWER" | grep -qiE '\bchmod\s+(-r\s+)?777\b' && block "chmod 777 is not allowed"

# ── Git — force push to protected branches ──────────────────────────────
if echo "$CMD_LOWER" | grep -qiE '\bgit\s+push.*(--force|-f)\b'; then
  echo "$CMD_LOWER" | grep -qiE '\b(main|master|production|prod)\b' && block "Force push to main/master/production is not allowed"
fi

# ── Prisma against production ─────────────────────────────────────────
if echo "$CMD_LOWER" | grep -qiE '\bprisma\s+db\s+(push|reset)\b'; then
  echo "$COMMAND" | grep -qiE '(DATABASE_URL.*prod|PROD_DB|PRODUCTION_DB)' && block "Prisma db push/reset against production is not allowed"
fi

# ── Credential exposure ─────────────────────────────────────────────────
echo "$CMD_LOWER" | grep -qiE '(echo|cat|printf|curl|wget).*(secret|_token|_password|api_key|_auth)' && block "Printing or sending sensitive env vars is not allowed"

exit 0
