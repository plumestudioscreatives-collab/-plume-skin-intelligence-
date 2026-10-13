#!/bin/bash
# Runs the Travel migrations and tests against a local Postgres that already holds the app's
# migrations (see README in this folder). Usage: run-tests.sh <psql connection args...>
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
PSQL="psql -qX -v ON_ERROR_STOP=1 $*"
for f in "$DIR"/../0*.sql; do $PSQL -1 -f "$f" >/dev/null; echo "applied $(basename "$f")"; done
$PSQL -f "$DIR/00_harness.sql" >/dev/null
for f in "$DIR"/0[2-9]_*_test.sql; do
  [ -f "$f" ] || continue
  $PSQL -f "$f" >/dev/null || { echo "ERROR in $(basename "$f")"; exit 1; }
  $PSQL -c "reset role" >/dev/null
done
$PSQL -tA -F ' | ' -c "select case when ok then 'pass' else 'FAIL' end, label, coalesce(detail, '') from tests.results where not ok order by n"
$PSQL -tA -c "select count(*) filter (where ok) || ' passed, ' || count(*) filter (where not ok) || ' failed' from tests.results"
