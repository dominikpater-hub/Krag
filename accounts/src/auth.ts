import crypto from 'node:crypto';

// C-1: koszt scrypt powyżej domyślnego 16384. maxmem podniesione, bo 128*N*r przekracza domyślne 32 MB.
const N = 1 << 15; // 32768
const OPTS = { N, maxmem: 128 * 1024 * 1024 };

/* Hasła: scrypt z solą, ASYNCHRONICZNIE (nie blokuje pętli zdarzeń Fastify — audyt C-1).
 * Format przechowywania: "<salt hex>:<hash hex>". */
export function hashPassword(pw: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(pw, salt, 32, OPTS, (err, dk) =>
      err ? reject(err) : resolve(salt + ':' + dk.toString('hex')));
  });
}

export function verifyPassword(pw: string, stored: string | null): Promise<boolean> {
  return new Promise((resolve) => {
    if (!stored || stored.indexOf(':') < 0) return resolve(false);
    const [salt, h] = stored.split(':');
    crypto.scrypt(pw, salt, 32, OPTS, (err, dk) => {
      if (err) return resolve(false);
      const hb = Buffer.from(h, 'hex');
      resolve(hb.length === dk.length && crypto.timingSafeEqual(hb, dk));
    });
  });
}

export function newToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

// C-2: w bazie trzymamy hash tokenu; wyciek bazy nie oddaje aktywnych sesji.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function daysFromNow(d: number): Date {
  return new Date(Date.now() + d * 86_400_000);
}
