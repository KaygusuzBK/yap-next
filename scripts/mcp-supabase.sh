#!/usr/bin/env bash
set -euo pipefail

# Loads env from .env.mcp if exists (not committed)
if [ -f ".env.mcp" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.mcp"
  set +a
fi

COMMAND=("npx" "-y" "@supabase/mcp-server-supabase@latest")

# Prefer Project API mode by default (URL + API key)
if [ -n "${SUPABASE_PROJECT_URL:-}" ] && [ -n "${SUPABASE_API_KEY:-}" ]; then
  COMMAND+=("--project-url" "${SUPABASE_PROJECT_URL}" "--api-key" "${SUPABASE_API_KEY}")
fi

# If PAT is provided, switch to Management API mode
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  COMMAND+=("--access-token" "${SUPABASE_ACCESS_TOKEN}")
fi

# Optional: lock to a single project (works with PAT mode)
if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  COMMAND+=("--project-ref" "${SUPABASE_PROJECT_REF}")
fi

# Read-only toggle
READ_ONLY=${MCP_SUPABASE_READ_ONLY:-true}
if [ "${READ_ONLY}" = "true" ]; then
  COMMAND+=("--read-only")
fi

echo "Starting Supabase MCP server..."
exec "${COMMAND[@]}"


