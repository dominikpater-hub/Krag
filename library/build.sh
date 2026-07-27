#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "── 1/7  migracja ziaren faktów"; rm -rf entries
for s in seed/facts-*.json; do node scripts/migrate.js "$s" | tail -1; done
echo "── 2/7  migracja miejsc";        node scripts/migrate-places.js | tail -1
echo "── 3/7  walidacja";              node scripts/validate.js | tail -2
echo "── 4/7  paczka aplikacji";       node scripts/export-to-app.js | head -1
echo "── 5/7  paczka wiedzy";          node scripts/paths-export.js | head -1
echo "── 6/7  lista miejsc";           node scripts/render-places.js | head -1
echo "── 7/7  arkusz + kolejka";       node scripts/review-export.js | head -1; node scripts/currency.js | head -1
echo "entries/: $(ls entries | wc -l | tr -d ' ')"
