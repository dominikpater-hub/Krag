import crypto from 'node:crypto';

/* Hasła: scrypt z solą. Format przechowywania: "<salt hex>:<hash hex>". */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 32).toString('hex');
  return salt + ':' + h;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored || stored.indexOf(':') < 0) return false;
  const [salt, h] = stored.split(':');
  const c = crypto.scryptSync(pw, salt, 32).toString('hex');
  const hb = Buffer.from(h, 'hex');
  const cb = Buffer.from(c, 'hex');
  return hb.length === cb.length && crypto.timingSafeEqual(hb, cb);
}

export function newToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function daysFromNow(d: number): Date {
  return new Date(Date.now() + d * 86_400_000);
}
