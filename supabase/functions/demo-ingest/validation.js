const encoder = new TextEncoder();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;
const MULTILINE_CONTROL_PATTERN = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/;

function clean(value) {
  return String(value ?? '').trim();
}

function validText(value, minimum, maximum, controlPattern = CONTROL_PATTERN) {
  return value.length >= minimum && value.length <= maximum && !controlPattern.test(value);
}

function controlSafe(value) {
  return !CONTROL_PATTERN.test(String(value ?? ''));
}

function cleanMultiline(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n').trim();
}

export function validateContentLength(value, maximumBytes = 16 * 1024) {
  const raw = value == null ? '' : String(value);
  if (!/^\d+$/.test(raw)) return { ok: false, status: 411 };
  const length = Number(raw);
  if (!Number.isSafeInteger(length)) return { ok: false, status: 411 };
  if (length > maximumBytes) return { ok: false, status: 413 };
  return { ok: true, length };
}

export function resolveSupabaseSecretKey(secretKeysJson, legacyServiceRoleKey) {
  if (secretKeysJson == null) return String(legacyServiceRoleKey ?? '').trim();
  try {
    const keys = JSON.parse(String(secretKeysJson));
    if (!keys || Array.isArray(keys) || typeof keys !== 'object') return '';
    return typeof keys.default === 'string' ? keys.default.trim() : '';
  } catch {
    return '';
  }
}

export function validateInternalPayload(payload = {}) {
  const name = clean(payload.name);
  const email = clean(payload.email).toLowerCase();
  const company = clean(payload.company);
  const normalisedWorkNeed = String(payload.work_need ?? '').replace(/\r\n?/g, '\n');
  const workNeed = cleanMultiline(payload.work_need);
  const ip = clean(payload.ip);
  const source = clean(payload.source);

  const valid = controlSafe(payload.name)
    && controlSafe(payload.email)
    && controlSafe(payload.company)
    && controlSafe(payload.ip)
    && controlSafe(payload.source)
    && !MULTILINE_CONTROL_PATTERN.test(normalisedWorkNeed)
    && validText(name, 1, 100)
    && validText(email, 3, 254)
    && EMAIL_PATTERN.test(email)
    && validText(company, 1, 160)
    && validText(workNeed, 1, 2000, MULTILINE_CONTROL_PATTERN)
    && validText(ip, 3, 45)
    && /^[0-9a-f:.]+$/i.test(ip)
    && validText(source, 1, 80)
    && /^[a-z0-9.-]+$/i.test(source);

  if (!valid) throw new Error('invalid_payload');
  return { name, email, company, workNeed, ip, source };
}

export function isFreshTimestamp(nowMs, timestampMs, windowMs = 60_000) {
  const now = Number(nowMs);
  const timestamp = Number(timestampMs);
  if (!Number.isFinite(now) || !Number.isFinite(timestamp)) return false;
  return Math.abs(now - timestamp) <= windowMs;
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function signHmac(secret, timestamp, requestId, rawBody) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = `${timestamp}.${requestId}.${rawBody}`;
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(signature));
}

function constantTimeHexEqual(left, right) {
  const a = String(left ?? '').toLowerCase();
  const b = String(right ?? '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

export async function verifyHmacSignature(secret, signature, timestamp, requestId, rawBody) {
  const expected = await signHmac(secret, timestamp, requestId, rawBody);
  return constantTimeHexEqual(signature, expected);
}

export async function hashIdentifier(value, salt) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}\u0000${String(value).trim().toLowerCase()}`));
  return bytesToHex(new Uint8Array(digest));
}
