/**
 * Shamir's Secret Sharing over GF(2^8)
 *
 * Zero external dependencies. Randomness sourced exclusively from
 * `globalThis.crypto.getRandomValues` — the W3C-blessed CSPRNG backed by
 * the OS, available in all modern browsers and Node.js 18+.
 *
 * Share wire format: 2-hex-char index prefix + hex-encoded share payload.
 *   e.g.  "01a3f7..." where "01" is share index 1.
 *
 * ⚠️  MIGRATION NOTE
 * This format is intentionally different from secrets.js-grempe's format.
 * Any shards produced by the old library (stored in TrustedContact.keyShard)
 * are incompatible with combineShares() here. Users will need to redo their
 * trusted contact setup, or you must run a one-time DB migration that
 * re-splits existing master seeds with the new implementation.
 *
 * Place this file at:
 *   Frontend  →  src/lib/shamir.ts
 *   Backend   →  src/utils/shamir.ts
 */

// ─── GF(2^8) arithmetic ───────────────────────────────────────────────────────
// Irreducible polynomial: x^8 + x^4 + x^3 + x + 1  (0x11b)

function gfMul(a: number, b: number): number {
  let p = 0;
  let aa = a;
  let bb = b;
  for (let i = 0; i < 8; i++) {
    if (bb & 1) p ^= aa;
    const carry = aa & 0x80;
    aa = (aa << 1) & 0xff;
    if (carry) aa ^= 0x1b;
    bb >>= 1;
  }
  return p;
}

/** a^-1 in GF(2^8) via Fermat: a^(2^8 - 2) = a^254 */
function gfInv(a: number): number {
  if (a === 0) throw new Error('GF(256): inverse of zero undefined');
  let result = 1;
  let base = a;
  let exp = 254;
  while (exp > 0) {
    if (exp & 1) result = gfMul(result, base);
    base = gfMul(base, base);
    exp >>= 1;
  }
  return result;
}

// ─── Polynomial helpers ───────────────────────────────────────────────────────

/** Horner's method: evaluate poly[0] + poly[1]x + ... at x in GF(2^8). */
function evalPoly(coeffs: Uint8Array, x: number): number {
  let y = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    y = gfMul(y, x) ^ coeffs[i];
  }
  return y;
}

/** Lagrange interpolation at x = 0 (recovers the secret byte). */
function interpolate(xs: number[], ys: number[]): number {
  let secret = 0;
  for (let i = 0; i < xs.length; i++) {
    let num = ys[i];
    let den = 1;
    for (let j = 0; j < xs.length; j++) {
      if (i !== j) {
        num = gfMul(num, xs[j]);
        den = gfMul(den, xs[j] ^ xs[i]);
      }
    }
    secret ^= gfMul(num, gfInv(den));
  }
  return secret;
}

// ─── Randomness ───────────────────────────────────────────────────────────────

/**
 * Secure random bytes from globalThis.crypto.getRandomValues.
 * Works in all modern browsers and Node.js 18+.
 */
function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string: odd length');
  const pairs = hex.match(/.{2}/g);
  if (!pairs) throw new Error('Invalid hex string');
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

/** Encode a UTF-8 string as a lowercase hex string. */
export function stringToHex(str: string): string {
  return bytesToHex(new TextEncoder().encode(str));
}

/** Decode a hex string back to a UTF-8 string. */
export function hexToString(hex: string): string {
  return new TextDecoder().decode(hexToBytes(hex));
}

// ─── Public SSS API ───────────────────────────────────────────────────────────

/**
 * Split a hex-encoded secret into `total` shares, any `threshold` of which
 * can reconstruct the original.
 *
 * @param hexSecret  Even-length hex string — the secret to protect.
 * @param total      Number of shares to produce (max 255).
 * @param threshold  Minimum shares required to reconstruct (min 2).
 * @returns          Array of hex-encoded share strings.
 */
export function splitSecret(
  hexSecret: string,
  total: number,
  threshold: number,
): string[] {
  if (threshold < 2) throw new Error('threshold must be ≥ 2');
  if (threshold > total) throw new Error('threshold cannot exceed total shares');
  if (total > 255) throw new Error('maximum 255 shares supported');
  if (hexSecret.length % 2 !== 0)
    throw new Error('hexSecret must be an even-length hex string');

  const secretBytes = hexToBytes(hexSecret);
  const sharePayloads = Array.from(
    { length: total },
    () => new Uint8Array(secretBytes.length),
  );

  // Sequential 1-based x-coordinates (share indices)
  const xs = Array.from({ length: total }, (_, i) => i + 1);

  for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
    // Degree-(threshold-1) polynomial with secret as the constant term
    const coeffs = new Uint8Array(threshold);
    coeffs[0] = secretBytes[byteIdx];

    const rand = randomBytes(threshold - 1);
    for (let i = 1; i < threshold; i++) {
      // Ensure the highest-degree coefficient is non-zero
      coeffs[i] = i === threshold - 1 && rand[i - 1] === 0 ? 1 : rand[i - 1];
    }

    for (let shareIdx = 0; shareIdx < total; shareIdx++) {
      sharePayloads[shareIdx][byteIdx] = evalPoly(coeffs, xs[shareIdx]);
    }
  }

  // Wire format: 2-char hex index prefix + hex payload
  return xs.map((x, i) =>
    x.toString(16).padStart(2, '0') + bytesToHex(sharePayloads[i]),
  );
}

/**
 * Reconstruct the original secret from at least `threshold` shares.
 *
 * @param shares  Array of hex-encoded share strings (≥ threshold required).
 * @returns       The original hex secret.
 */
export function combineShares(shares: string[]): string {
  if (!shares || shares.length < 2)
    throw new Error('At least 2 shares are required');

  for (const share of shares) {
    if (
      typeof share !== 'string' ||
      share.length < 4 ||
      share.length % 2 !== 0 ||
      !/^[0-9a-fA-F]+$/.test(share)
    ) {
      throw new Error(
        'Invalid share format — expected even-length hex string with 2-char index prefix',
      );
    }
  }

  const xs = shares.map((s) => parseInt(s.slice(0, 2), 16));
  const payloads = shares.map((s) => hexToBytes(s.slice(2)));

  // Guard: duplicate x-coordinates corrupt Lagrange interpolation silently
  if (new Set(xs).size !== xs.length)
    throw new Error('Duplicate share indices detected');

  const secretLength = payloads[0].length;
  if (!payloads.every((p) => p.length === secretLength))
    throw new Error('Shares have inconsistent payload lengths');

  const secretBytes = new Uint8Array(secretLength);
  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    const ys = payloads.map((p) => p[byteIdx]);
    secretBytes[byteIdx] = interpolate(xs, ys);
  }

  return bytesToHex(secretBytes);
}