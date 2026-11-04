import type { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import QRCode from 'qrcode';
import { env } from '../../config/env';
import { FieldValue, db } from '../../config/firebase';
import { AppError, conflict, forbidden, notFound } from '../../lib/errors';
import { snapToObject } from '../../lib/firestore';
import { authenticityCode, slugify } from '../../lib/ids';
import { uploadBuffer } from '../../lib/storage';
import type { AuthUser } from '../../types/express';
import type { AuthenticityCode, Product } from '../../types/models';

const codes = db.collection('authenticityCodes');
const products = db.collection('products');
const regions = db.collection('mapRegions');
const closetOf = (uid: string) => db.collection('users').doc(uid).collection('closet');

export const verifyUrl = (code: string) => `${env.APP_BASE_URL.replace(/\/$/, '')}/verify/${code}`;

interface NewCode {
  productId?: string | null;
  closetItemId?: string | null;
  ownerUid?: string | null;
  title: string;
  imageUrl: string | null;
  story: string | null;
}

/** Creates one unique code + its QR image (stored in Firebase Storage). */
export async function createCode(input: NewCode): Promise<AuthenticityCode> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = authenticityCode();
    const ref = codes.doc(code);
    try {
      await ref.create({
        code,
        productId: input.productId ?? null,
        closetItemId: input.closetItemId ?? null,
        ownerUid: input.ownerUid ?? null,
        title: input.title,
        imageUrl: input.imageUrl,
        story: input.story,
        qrUrl: null,
        qrPath: null,
        status: 'unclaimed',
        claimedBy: null,
        claimedAt: null,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      if ((err as { code?: number }).code === 6) continue; // ALREADY_EXISTS → generate another code
      throw err;
    }

    try {
      const png = await QRCode.toBuffer(verifyUrl(code), { type: 'png', width: 600, margin: 2, errorCorrectionLevel: 'M' });
      const stored = await uploadBuffer(png, `authenticity/${code}.png`, 'image/png');
      await ref.update({ qrUrl: stored.url, qrPath: stored.path });
    } catch (err) {
      await ref.delete().catch(() => undefined);
      throw err;
    }
    return snapToObject<AuthenticityCode>(await ref.get());
  }
  throw new AppError(500, 'CODE_GENERATION_FAILED', 'Could not generate a unique code. Please try again.');
}

/** Staff: a batch of codes for a standard collection piece, ready to print on packaging. */
export async function generateForProduct(productId: string, quantity: number): Promise<AuthenticityCode[]> {
  const snap = await products.doc(productId).get();
  if (!snap.exists) throw notFound('Piece not found');
  const p = snapToObject<Product>(snap);
  const out: AuthenticityCode[] = [];
  for (let i = 0; i < quantity; i += 1) {
    out.push(await createCode({ productId: p.id, title: p.title, imageUrl: p.imageUrls[0] ?? null, story: p.story || null }));
  }
  return out;
}

export async function listCodes(limit: number): Promise<AuthenticityCode[]> {
  const snaps = await codes.orderBy('createdAt', 'desc').limit(limit).get();
  return snaps.docs.map((d) => snapToObject<AuthenticityCode>(d));
}

/** Public lookup: is this a genuine Aradam piece? Never reveals who owns it. */
export async function verify(rawCode: string) {
  const snap = await codes.doc(rawCode.trim().toUpperCase()).get();
  if (!snap.exists) return { valid: false as const };
  const c = snapToObject<AuthenticityCode>(snap);
  return { valid: true as const, claimed: c.status === 'claimed', title: c.title, imageUrl: c.imageUrl, story: c.story };
}

export interface ClaimInput {
  code: string;
  shareLocation: boolean;
  country?: string;
  state?: string;
}

/**
 * Owner scans the QR code on the packaging and claims the piece. In one transaction:
 *  - the code is marked claimed (a code can only ever belong to one account),
 *  - the piece appears in (or is marked authenticated inside) the customer's digital closet,
 *  - if the customer opted in, a region-level counter is incremented for the global map.
 * The map stores only counts per country/state — never who, where exactly, or when.
 */
export async function claim(user: AuthUser, input: ClaimInput) {
  const code = input.code.trim().toUpperCase();
  const codeRef = codes.doc(code);
  const country = input.shareLocation && input.country ? input.country.toUpperCase() : null;
  const state = country && input.state ? input.state.trim() : null;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(codeRef);
    if (!snap.exists) throw notFound('That authenticity code was not recognised', 'CODE_NOT_FOUND');
    const c = snapToObject<AuthenticityCode>(snap);

    if (c.status === 'claimed') {
      if (c.claimedBy === user.uid) return { closetItemId: c.closetItemId, alreadyClaimed: true, locationRegistered: false };
      throw conflict('This piece has already been authenticated by another owner', 'ALREADY_CLAIMED');
    }
    if (c.ownerUid && c.ownerUid !== user.uid) throw forbidden('This code is reserved for a different account', 'CODE_RESERVED');

    let itemRef: DocumentReference;
    let existing: DocumentSnapshot | null = null;
    if (c.closetItemId && c.ownerUid) {
      itemRef = closetOf(c.ownerUid).doc(c.closetItemId);
      existing = await tx.get(itemRef);
    } else {
      itemRef = closetOf(user.uid).doc();
    }

    // ── writes ──
    if (existing?.exists) {
      tx.update(itemRef, { authenticated: true, authenticityCode: code, updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(itemRef, {
        source: 'purchase',
        title: c.title,
        story: c.story,
        imageUrls: c.imageUrl ? [c.imageUrl] : [],
        productId: c.productId,
        consultationId: null,
        authenticityCode: code,
        authenticated: true,
        status: 'owned',
        isFavorite: false,
        position: null,
        notes: null,
        addedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(codeRef, { status: 'claimed', claimedBy: user.uid, claimedAt: FieldValue.serverTimestamp(), closetItemId: itemRef.id });

    if (country) {
      const regionId = `${country}__${slugify(state ?? 'all')}`;
      tx.set(
        regions.doc(regionId),
        { country, state, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    return { closetItemId: itemRef.id, alreadyClaimed: false, locationRegistered: !!country };
  });
}
