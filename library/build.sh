#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# head/tail zamykają strumień wcześnie → node dostaje EPIPE, a `pipefail` wywraca build (audyt S-4).
# h1 drenuje resztę wyjścia, żeby pisarz nie zginął na SIGPIPE.
h1(){ { head -1; cat >/dev/null; }; }

echo "── 1/8  migracja ziaren faktów"; rm -rf entries
for s in seed/facts-*.json; do node scripts/migrate.js "$s" | tail -1; done
echo "── 1.5   odtworzenie podpisów (A-1)"; node scripts/restore-signatures.js | tail -1
echo "── 2/8  migracja miejsc";          node scripts/migrate-places.js | tail -1
echo "── 3/8  walidacja";                node scripts/validate.js | tail -3
echo "── 4/8  paczka aplikacji";         node scripts/export-to-app.js | h1
echo "── 5/8  paczka wiedzy (bramkowana)"; node scripts/paths-export.js | h1
echo "── 6/8  paczka demo + wstrzyknięcie do index.html"
#  Honest artefakt: dist/knowledge.json (treść wstrzymana bramką, dopóki brak podpisów).
#  Do aplikacji wstrzykujemy build DEMO — treść widoczna, ale KAŻDA odpowiedź nosi
#  ostrzeżenie „nikt tego nie sprawdził". Aby aplikacja pokazywała honest-empty,
#  zmień źródło wstrzyknięcia poniżej na dist/knowledge.json.
KRAG_INCLUDE_UNSIGNED=1 KRAG_OUT=knowledge.demo.json node scripts/paths-export.js >/dev/null
node scripts/inject-kb.js ../index.html dist/knowledge.demo.json | h1
echo "── 7/8  lista miejsc";             node scripts/render-places.js | h1
echo "── 8/8  arkusz + kolejka";         node scripts/review-export.js | h1; node scripts/currency.js | h1
echo "entries/: $(ls entries | wc -l | tr -d ' ')"
