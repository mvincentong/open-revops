#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# guard-secrets.sh — OpenRevOps PreToolUse safety hook
#
# Purpose: stop an agent from (a) writing/editing files that are meant to hold
# real secrets, or (b) committing secret-shaped content to the repository.
# This is a guardrail, not a vault: the real backstops are .gitignore, the
# repository secret scan in CI, and never putting real keys on disk in-repo.
#
# Protocol: Claude Code passes the tool call as JSON on stdin. We exit 0 to
# allow, or exit 2 to BLOCK the call and return the message on stderr to the
# agent. We "fail open" (allow) only if we cannot parse the input, so a missing
# JSON parser never bricks a session — CI secret scanning remains the hard gate.
# Docs: https://docs.claude.com/en/docs/claude-code/hooks
# -----------------------------------------------------------------------------
set -u

INPUT="$(cat)"

# --- Extract fields from the tool-call JSON (prefer jq, then python3) ---------
extract() { # $1 = python/jq expression key path
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r "$1 // empty" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$INPUT" | python3 -c "import json,sys;d=json.load(sys.stdin);print(eval(\"d$2\") or '')" 2>/dev/null
  fi
}

TOOL="$(extract '.tool_name' "['tool_name']")"
FILE="$(extract '.tool_input.file_path' "['tool_input']['file_path']")"
CMD="$(extract '.tool_input.command' "['tool_input']['command']")"

# Content the call would introduce (Write.content / Edit.new_string / Bash.command).
BLOB="$(printf '%s' "$INPUT" | tr -d '\000' | tr '[:upper:]' '[:lower:]')"

block() { # $1 = reason
  echo "BLOCKED by .claude/hooks/guard-secrets.sh: $1" >&2
  echo "If this is intentional and the content is NOT a real secret, the user can" >&2
  echo "approve it manually or adjust .claude/settings.json. Never commit real keys." >&2
  exit 2
}

# --- 1) Protect secret-bearing file PATHS ------------------------------------
# Match real secret files but always ALLOW the documented placeholders file.
is_secret_path() {
  local p="$1"
  case "$p" in
    *".env.example"|*".env.sample"|*".env.template") return 1 ;;  # allowed
    *"/.env"|".env"|*"/.env."*|".env."*) return 0 ;;              # .env / .env.local …
    *"/secrets/"*|"secrets/"*) return 0 ;;
    *.pem|*.key|*.p12|*.pfx|*.keystore|*.jks) return 0 ;;
    *"id_rsa"*|*"id_ed25519"*) return 0 ;;
    *"service-account"*.json|*"credentials.json"|*"gcp-"*.json) return 0 ;;
  esac
  return 1
}

if [ -n "${FILE:-}" ] && is_secret_path "$FILE"; then
  block "writing to a secret-bearing path ('$FILE'). Secrets live in the environment, not the repo."
fi

# --- 2) Block staging secret files via Bash git add --------------------------
if [ "${TOOL:-}" = "Bash" ] && printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+add'; then
  if printf '%s' "$CMD" | grep -Eq '(^|[[:space:]/])\.env([[:space:]]|$|\.)|secrets/|\.pem|\.key([[:space:]]|$)'; then
    case "$CMD" in
      *".env.example"*) : ;;  # allow staging the example file
      *) block "attempting to 'git add' a secret-bearing path." ;;
    esac
  fi
fi

# --- 3) Block obvious LIVE-credential content --------------------------------
# We match only short, PUBLIC key *prefixes* / format markers — never real
# tokens. Test/sandbox prefixes (sk_test_, pk_test_) and "xxx"/<placeholder>
# values are intentionally allowed so docs and .env.example pass.
#   - Stripe live secret/restricted key prefixes:      sk_live_ / rk_live_
#   - AWS access key id prefix:                         akia
#   - GitHub personal access token prefix:             ghp_
#   - PEM private-key block header (format marker):     "begin ... private key"
if printf '%s' "$BLOB" | grep -Eq 'sk_live_|rk_live_|ghp_[a-z0-9]|akia[a-z0-9]{6,}|begin [a-z ]*private key'; then
  block "content contains a LIVE-credential marker. Use test/sandbox keys and the environment only."
fi

exit 0
