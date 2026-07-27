#!/usr/bin/env node
/**
 * export-to-app.js — entries/ → dist/
 *
 * Builder czyta WYŁĄCZNIE pole `rights` przy decyzji, czy treść może opuścić repo,
 * i WYŁĄCZNIE `status` + `verifiedBy` przy decyzji, czy może trafić do użytkownika.
 * To dwie osobne bramki i celowo nie są połączone.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
const DIST = path.join(ROOT, 'dist');
fs.mkdirSync(path.join(DIST, 'offline'), { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const entries = fs.readdirSync(path.join(ROOT, 'entries'))
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')));

const shipped = [];
const held = { rights: [], unverified: [], stale: [] };

for (const e of entries) {
  const v = e.versions.find(x => x.id === e.currentVersion);

  // Bramka 1 — prawa. Decyduje o redystrybucji treści.
  const canRedistribute = policy.rights[v.rights]?.redistribute === true;

  // Bramka 2 — weryfikacja. Decyduje, czy to w ogóle jest wiedza.
  const verified = e.status === 'PUBLISHED' && !!v.verifiedBy;

  if (!verified) { held.unverified.push(e.id); continue; }
  if (!canRedistribute) { held.rights.push({ id: e.id, rights: v.rights }); continue; }
  if (v.nextReviewDue && v.nextReviewDue < today) held.stale.push(e.id);

  shipped.push({
    id: e.id,
    block: e.block,
    topic: e.topic,
    kind: e.kind,
    why: v.content.summary,
    source: v.source.reference,
    edition: v.edition,
    confidence: v.confidence,
    verifiedBy: v.verifiedBy,
    nextReviewDue: v.nextReviewDue,
    stale: !!(v.nextReviewDue && v.nextReviewDue < today)
  });
}

const pkg = {
  product: 'krag',
  domain: 'HIV',
  language: 'pl',
  country: 'PL',
  tier: 'TIER_1',
  builtAt: today,
  policyVersion: policy.version,
  count: shipped.length,
  facts: shipped
};

fs.writeFileSync(path.join(DIST, 'offline', 'krag-hiv-pl.json'), JSON.stringify(pkg, null, 2) + '\n');

const report = {
  builtAt: today,
  entriesTotal: entries.length,
  shipped: shipped.length,
  heldUnverified: held.unverified.length,
  heldByRights: held.rights.length,
  staleShipped: held.stale.length,
  heldByRightsDetail: held.rights
};
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`export: ${entries.length} wpisów w bibliotece → ${shipped.length} w paczce`);
console.log(`  wstrzymane brakiem weryfikacji: ${held.unverified.length}`);
console.log(`  wstrzymane bramką praw:         ${held.rights.length}`);
console.log(`  wysłane, ale po terminie:       ${held.stale.length}`);
if (shipped.length === 0) {
  console.log('\nPaczka jest pusta i tak ma być. Krąg pokaże „nie mamy tego jeszcze",');
  console.log('a nie niezweryfikowaną treść medyczną podpisaną cudzym autorytetem.');
}
