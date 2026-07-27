#!/usr/bin/env node
/**
 * verify.js — jedyna droga z DRAFT do PUBLISHED.
 *
 *   node scripts/verify.js --block pep --by "dr n. med. X, zakaźnik" --note "sprawdzone wg PTN AIDS 2025 rozdz. 6"
 *   node scripts/verify.js --id hiv-0067 --by "..." 
 *   node scripts/verify.js --block prawo --by "..." --reject "przepis zmieniony"
 *
 * Podpis jest imienny i idzie do wersji, nie do wpisu. Wersja raz opublikowana
 * nie jest edytowana — poprawka to nowa wersja (ADR-002).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf('--' + k); return i === -1 ? null : args[i + 1]; };

const block = arg('block');
const id = arg('id');
const by = arg('by');
const note = arg('note');
const reject = arg('reject');
const dry = args.includes('--dry');

if (!by) {
  console.error('verify: brakuje --by "imię i rola osoby podpisującej".');
  console.error('Podpis anonimowy nie jest podpisem — po to jest to pole.');
  process.exit(1);
}
if (!block && !id) {
  console.error('verify: podaj --block <nazwa> albo --id <hiv-NNNN>');
  process.exit(1);
}

const now = new Date().toISOString();
const files = fs.readdirSync(path.join(ROOT, 'entries')).filter(f => f.endsWith('.json'));
let touched = 0;

for (const file of files) {
  const p = path.join(ROOT, 'entries', file);
  const e = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (id && e.id !== id) continue;
  if (block && e.block !== block) continue;

  const v = e.versions.find(x => x.id === e.currentVersion);

  if (reject) {
    e.status = 'REJECTED';
    v.rejectedAt = now;
    v.rejectedBy = by;
    v.rejectionReason = reject;
  } else {
    if (v.verifiedBy) { continue; }        // już podpisane — nie nadpisujemy
    e.status = 'PUBLISHED';
    v.verifiedAt = now;
    v.verifiedBy = by;
    if (note) v.verificationNote = note;
    v.checksum = crypto.createHash('sha256')
      .update(JSON.stringify({ ...v, checksum: null }))
      .digest('hex').slice(0, 16);
  }

  touched++;
  if (!dry) fs.writeFileSync(p, JSON.stringify(e, null, 2) + '\n');
}

const verb = reject ? 'odrzucono' : 'podpisano';
console.log(`verify: ${verb} ${touched} wpisów${dry ? ' (próba, nic nie zapisano)' : ''}`);
if (touched && !reject) {
  console.log(`podpis: ${by}`);
  console.log(`Uruchom ./build.sh — te wpisy wejdą teraz do paczki.`);
}
