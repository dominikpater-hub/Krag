#!/usr/bin/env node
/**
 * currency.js — kolejka „co dziś wymaga uwagi".
 * Sortowanie po koszcie zaniedbania, nie po dacie: fakt o oknie 72 godzin
 * kosztuje więcej niż liczba zakażeń sprzed dwóch lat.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const warnAt = new Date(Date.now() + policy.review.warnBeforeDays * 864e5).toISOString().slice(0, 10);

// koszt zaniedbania: ile kosztuje pomyłka w tym bloku
const COST = {
  pep: 100, ekspozycja: 95, 'prep-pl': 80, 'leczenie-pl': 75,
  uu: 70, prawo: 60, testowanie: 55, prep: 50, leczenie: 45,
  ciaza: 45, transmisja: 40, przebieg: 30, wspolistniejace: 25,
  stygma: 20, wyleczenie: 15, epidemiologia: 10, granice: 90,
  odbudowa: 52, bezpieczenstwo: 68, psyche: 35
};

const rows = fs.readdirSync(path.join(ROOT, 'entries'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')))
  .map(e => {
    const v = e.versions.find(x => x.id === e.currentVersion);
    const overdue = v.nextReviewDue && v.nextReviewDue < today;
    const soon = !overdue && v.nextReviewDue && v.nextReviewDue < warnAt;
    const reasons = [];
    if (!v.verifiedBy) reasons.push('brak podpisu');
    if (overdue) reasons.push('po terminie przeglądu');
    else if (soon) reasons.push('termin za chwilę');
    if (v.rights === 'UNKNOWN') reasons.push('prawa nieustalone');
    return {
      id: e.id, block: e.block, topic: e.topic,
      due: v.nextReviewDue, verifier: e.requiredVerifier,
      cost: COST[e.block] ?? 10,
      urgency: (COST[e.block] ?? 10) + (overdue ? 50 : soon ? 20 : 0) + (!v.verifiedBy ? 30 : 0),
      reasons
    };
  })
  .filter(r => r.reasons.length)
  .sort((a, b) => b.urgency - a.urgency);

console.log(`currency: ${rows.length} pozycji wymaga uwagi (stan na ${today})\n`);

const byVerifier = {};
for (const r of rows) (byVerifier[r.verifier] ??= []).push(r);

for (const [verifier, list] of Object.entries(byVerifier).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── ${verifier} — ${list.length} wpisów`);
  const blocks = [...new Set(list.map(r => r.block))];
  for (const b of blocks) {
    const n = list.filter(r => r.block === b).length;
    console.log(`     ${b.padEnd(16)} ${String(n).padStart(3)}`);
  }
  console.log('');
}

console.log('Pierwsze dziesięć po koszcie zaniedbania:');
for (const r of rows.slice(0, 10)) {
  console.log(`  [${String(r.urgency).padStart(3)}] ${r.id}  ${r.block}/${r.topic} — ${r.reasons.join(', ')}`);
}
