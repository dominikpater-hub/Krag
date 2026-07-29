'use strict';
/* gate.js — JEDNA implementacja obu bramek publikacji (audyt K-1).
 * Wołają ją oba eksportery (export-to-app.js i paths-export.js), żeby żaden
 * nie omijał zasady: treść medyczna nie wychodzi do użytkownika bez podpisu
 * człowieka i bez prawa do redystrybucji. Dodatkowo (W-5): źródło bez lokalizatora
 * jest dla recenzenta tym samym co brak źródła — taki fakt też jest niepublikowalny.
 */

function canRedistribute(policy, rights) {
  const r = policy.rights[rights];
  return !!(r && r.redistribute === true);
}

function isVerified(entry, version) {
  return entry.status === 'PUBLISHED' && !!version.verifiedBy;
}

function hasLocator(version) {
  const s = version && version.source;
  return !!(s && typeof s === 'object' && s.locator);
}

/* Czy TREŚĆ faktu może trafić do użytkownika.
 * Zwraca null gdy wolno, albo powód wstrzymania: 'unverified' | 'rights' | 'locator'. */
function heldReason(policy, entry, version) {
  if (!isVerified(entry, version)) return 'unverified';
  if (!canRedistribute(policy, version.rights)) return 'rights';
  if (!hasLocator(version)) return 'locator';
  return null;
}

/* Bloki wymagające podpisu weryfikatora — suma OBU list z policy (audyt K-4):
 * publishGate.requireVerifierForBlocks ∪ klucze verifierByBlock. */
function gatedBlocks(policy) {
  const req = (policy.publishGate && policy.publishGate.requireVerifierForBlocks) || [];
  const byBlock = policy.verifierByBlock ? Object.keys(policy.verifierByBlock) : [];
  return new Set([...req, ...byBlock]);
}

module.exports = { canRedistribute, isVerified, hasLocator, heldReason, gatedBlocks };
