/**
 * ERC-5564 Stealth Addresses — secp256k1 (scheme id 1)
 *
 * Core cryptography:
 *   - Key / meta-address generation
 *   - Sender: derive stealth address + ephemeral pubkey + view tag
 *   - Recipient: check announcement (view-tag fast path) + derive stealth private key
 *
 * Built on @noble/curves v2 (the secp256k1 ethers uses under the hood).
 * No hand-rolled field arithmetic.
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { computeAddress } from "ethers";

const Point = secp256k1.Point;
const CURVE_ORDER = Point.Fn.ORDER;

// ---------- helpers ----------

function stripHex(hex: string): string {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function bytesToHex0x(bytes: Uint8Array): string {
  return "0x" + bytesToHex(bytes);
}

function scalarToBytes(scalar: bigint): Uint8Array {
  return hexToBytes(scalar.toString(16).padStart(64, "0"));
}

// shared secret = keccak256( compressed(sharedPoint) )
function hashSharedSecret(point: InstanceType<typeof Point>): Uint8Array {
  return keccak_256(point.toBytes(true)); // compressed 33 bytes
}

// ---------- types ----------

export interface StealthKeys {
  spendingPrivateKey: string;
  spendingPublicKey: string;
  viewingPrivateKey: string;
  viewingPublicKey: string;
  stealthMetaAddress: string;
}

export interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
  viewTag: string;
}

// ---------- key generation ----------

export function generateStealthKeys(): StealthKeys {
  const spendingPrivateKey = secp256k1.utils.randomSecretKey();
  const viewingPrivateKey = secp256k1.utils.randomSecretKey();

  const spendingPublicKey = secp256k1.getPublicKey(spendingPrivateKey, true);
  const viewingPublicKey = secp256k1.getPublicKey(viewingPrivateKey, true);

  const stealthMetaAddress =
    "st:eth:0x" + bytesToHex(spendingPublicKey) + bytesToHex(viewingPublicKey);

  return {
    spendingPrivateKey: bytesToHex0x(spendingPrivateKey),
    spendingPublicKey: bytesToHex0x(spendingPublicKey),
    viewingPrivateKey: bytesToHex0x(viewingPrivateKey),
    viewingPublicKey: bytesToHex0x(viewingPublicKey),
    stealthMetaAddress,
  };
}

export function parseMetaAddress(meta: string): {
  spendingPublicKey: Uint8Array;
  viewingPublicKey: Uint8Array;
} {
  const hex = stripHex(meta.replace("st:eth:", ""));
  if (hex.length !== 132) {
    throw new Error("Invalid stealth meta-address length");
  }
  return {
    spendingPublicKey: hexToBytes(hex.slice(0, 66)),
    viewingPublicKey: hexToBytes(hex.slice(66, 132)),
  };
}

// ---------- sender side ----------

export function generateStealthAddress(metaAddress: string): StealthAddressResult {
  const { spendingPublicKey, viewingPublicKey } = parseMetaAddress(metaAddress);

  // 1. ephemeral keypair
  const ephemeralPrivateKey = secp256k1.utils.randomSecretKey();
  const ephemeralPublicKey = secp256k1.getPublicKey(ephemeralPrivateKey, true);

  // 2. shared secret = ECDH(ephemeralPriv, viewingPub)
  const viewPub = Point.fromBytes(viewingPublicKey);
  const ephPrivScalar = BigInt("0x" + bytesToHex(ephemeralPrivateKey));
  const sharedPoint = viewPub.multiply(ephPrivScalar);
  const sharedSecret = hashSharedSecret(sharedPoint);

  // 3. view tag = first byte
  const viewTag = sharedSecret[0];

  // 4. stealth pubkey = spendingPub + (sharedSecret * G)
  const spendPub = Point.fromBytes(spendingPublicKey);
  const secretScalar = BigInt("0x" + bytesToHex(sharedSecret)) % CURVE_ORDER;
  const secretPoint = Point.BASE.multiply(secretScalar);
  const stealthPubPoint = spendPub.add(secretPoint);

  // 5. address = last 20 bytes of keccak(uncompressed pubkey body)
  const stealthAddress = computeAddress(bytesToHex0x(stealthPubPoint.toBytes(false)));

  return {
    stealthAddress,
    ephemeralPublicKey: bytesToHex0x(ephemeralPublicKey),
    viewTag: "0x" + viewTag.toString(16).padStart(2, "0"),
  };
}

// ---------- recipient side ----------

export function checkViewTag(
  viewingPrivateKey: string,
  ephemeralPublicKey: string,
  announcedViewTag: string
): Uint8Array | null {
  const ephPub = Point.fromBytes(hexToBytes(stripHex(ephemeralPublicKey)));
  const viewPrivScalar = BigInt(viewingPrivateKey);
  const sharedPoint = ephPub.multiply(viewPrivScalar);
  const sharedSecret = hashSharedSecret(sharedPoint);

  const computedTag = sharedSecret[0];
  const expectedTag = parseInt(stripHex(announcedViewTag), 16);

  return computedTag === expectedTag ? sharedSecret : null;
}

export function checkAnnouncement(
  spendingPublicKey: string,
  viewingPrivateKey: string,
  ephemeralPublicKey: string,
  announcedViewTag: string
): string | null {
  const sharedSecret = checkViewTag(viewingPrivateKey, ephemeralPublicKey, announcedViewTag);
  if (!sharedSecret) return null;

  const spendPub = Point.fromBytes(hexToBytes(stripHex(spendingPublicKey)));
  const secretScalar = BigInt("0x" + bytesToHex(sharedSecret)) % CURVE_ORDER;
  const secretPoint = Point.BASE.multiply(secretScalar);
  const stealthPubPoint = spendPub.add(secretPoint);

  return computeAddress(bytesToHex0x(stealthPubPoint.toBytes(false)));
}

export function deriveStealthPrivateKey(
  spendingPrivateKey: string,
  viewingPrivateKey: string,
  ephemeralPublicKey: string
): string {
  const ephPub = Point.fromBytes(hexToBytes(stripHex(ephemeralPublicKey)));
  const viewPrivScalar = BigInt(viewingPrivateKey);
  const sharedPoint = ephPub.multiply(viewPrivScalar);
  const sharedSecret = hashSharedSecret(sharedPoint);

  const spendPrivScalar = BigInt(spendingPrivateKey);
  const secretScalar = BigInt("0x" + bytesToHex(sharedSecret));
  const stealthPriv = (spendPrivScalar + secretScalar) % CURVE_ORDER;

  return bytesToHex0x(scalarToBytes(stealthPriv));
}