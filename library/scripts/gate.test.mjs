/* Testy bramek publikacji (audyt S-7) — jedyny kod, który MUSI mieć testy.
 * Uruchom: node --test library/scripts/gate.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const gate = require('./gate.js');
const policy = require('../policy.json');

const V = (over = {}) => ({ rights: 'PUBLIC_DOMAIN', verifiedBy: null, source: { id: 'x', locator: 'https://x' }, ...over });

test('wpis bez podpisu NIE wychodzi (unverified)', () => {
  assert.equal(gate.heldReason(policy, { status: 'DRAFT' }, V()), 'unverified');
});

test('wpis QUOTE_ONLY NIE wychodzi, nawet podpisany (rights)', () => {
  const v = V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X' });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), 'rights');
});

test('podpisany + redystrybuowalny, ale bez lokalizatora NIE wychodzi (W-5)', () => {
  const v = V({ verifiedBy: 'dr X', source: { id: 'x' } });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), 'locator');
});

test('podpisany + redystrybuowalny + lokalizator = publikowalny (null)', () => {
  const v = V({ verifiedBy: 'dr X' });
  assert.equal(gate.heldReason(policy, { status: 'PUBLISHED' }, v), null);
});

test('A-2: parafraza QUOTE_ONLY — domyślnie wstrzymana, po włączeniu publikowalna', () => {
  const v = V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X' });
  const pub = { status: 'PUBLISHED' };
  // domyślnie (publishParaphrased brak/false) → wstrzymane
  assert.equal(gate.heldReason(policy, pub, v), 'rights');
  // po decyzji prawnej (flaga true) → parafraza publikowalna
  const p2 = { ...policy, derivedRights: { publishParaphrased: true, blockedForParaphrase: ['INTERNAL_ONLY', 'UNKNOWN'] } };
  assert.equal(gate.heldReason(p2, pub, v), null);
  // cytat dosłowny nadal nie
  assert.equal(gate.heldReason(p2, pub, V({ rights: 'QUOTE_ONLY', verifiedBy: 'dr X', verbatim: true })), 'rights');
  // UNKNOWN nadal nie
  assert.equal(gate.heldReason(p2, pub, V({ rights: 'UNKNOWN', verifiedBy: 'dr X' })), 'rights');
});

test('gatedBlocks = suma obu list z policy (K-4)', () => {
  const g = gate.gatedBlocks(policy);
  assert.ok(g.has('pep'), 'blok medyczny z requireVerifierForBlocks');
  assert.ok(g.has('prawo'), 'blok z verifierByBlock');
  assert.ok(g.has('stygma'), 'blok z verifierByBlock');
});
