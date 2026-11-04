import { randomInt } from 'crypto';

// No 0/O/1/I/L to keep codes readable when typed by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

export function orderNumber(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `ARD-${yy}${mm}${dd}-${randomCode(4)}`;
}

/** Printed on the physical packaging, e.g. ARD-7K2M-QX94-HT3P */
export function authenticityCode(): string {
  return `ARD-${randomCode(4)}-${randomCode(4)}-${randomCode(4)}`;
}
