#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Usage: DATABASE_URL=postgres://user:pass@host:5432/dbname bash sql/apply.sh"
  exit 1
fi

run() {
  local file="$1"
  echo "Applying $file ..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

run 00_functions.sql
run 01_tables.sql
run 02_rls.sql
run 03_tasks.sql

echo "All SQL applied successfully."
