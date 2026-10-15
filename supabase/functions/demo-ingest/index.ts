import { createClient } from '@supabase/supabase-js';
import {
  hashIdentifier,
  isFreshTimestamp,
  resolveSupabaseSecretKey,
  validateContentLength,
  validateInternalPayload,
  verifyHmacSignature,
} from './validation.js';

const MAX_BODY_BYTES = 16 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    },
  });
}

function logResult(requestId: string, code: string) {
  console.log(JSON.stringify({ request_id: requestId || 'missing', code }));
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'request_rejected' });

  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  if (contentType !== 'application/json') return json(415, { ok: false, error: 'request_rejected' });

  const contentLength = validateContentLength(request.headers.get('content-length'), MAX_BODY_BYTES);
  if (!contentLength.ok) return json(contentLength.status, { ok: false, error: 'request_rejected' });

  const timestamp = request.headers.get('x-assistall-timestamp') ?? '';
  const requestId = request.headers.get('x-assistall-request-id') ?? '';
  const signature = request.headers.get('x-assistall-signature') ?? '';
  if (!UUID_PATTERN.test(requestId) || !isFreshTimestamp(Date.now(), Number(timestamp))) {
    logResult(requestId, 'stale_or_invalid_request');
    return json(401, { ok: false, error: 'request_rejected' });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json(413, { ok: false, error: 'request_rejected' });

  const hmacSecret = Deno.env.get('WEBSITE_HMAC_SECRET') ?? '';
  const hashSalt = Deno.env.get('RATE_LIMIT_HASH_SALT') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseSecret = resolveSupabaseSecretKey(
    Deno.env.get('SUPABASE_SECRET_KEYS'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  );
  if (hmacSecret.length < 32 || hashSalt.length < 32 || !supabaseUrl || !supabaseSecret) {
    logResult(requestId, 'server_not_configured');
    return json(503, { ok: false, error: 'temporarily_unavailable' });
  }

  if (!(await verifyHmacSignature(hmacSecret, signature, timestamp, requestId, rawBody))) {
    logResult(requestId, 'invalid_signature');
    return json(401, { ok: false, error: 'request_rejected' });
  }

  let payload;
  try {
    payload = validateInternalPayload(JSON.parse(rawBody));
  } catch {
    logResult(requestId, 'invalid_payload');
    return json(422, { ok: false, error: 'check_your_details' });
  }

  const [ipHash, emailHash] = await Promise.all([
    hashIdentifier(payload.ip, hashSalt),
    hashIdentifier(payload.email, hashSalt),
  ]);

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.rpc('ingest_demo_request', {
    p_request_id: requestId,
    p_name: payload.name,
    p_email: payload.email,
    p_company: payload.company,
    p_work_need: payload.workNeed,
    p_source: payload.source,
    p_ip_hash: ipHash,
    p_email_hash: emailHash,
  });

  if (error) {
    logResult(requestId, 'database_error');
    return json(503, { ok: false, error: 'temporarily_unavailable' });
  }
  if (!data?.ok) {
    logResult(requestId, String(data?.reason ?? 'rejected'));
    const status = data?.reason === 'rate_limited' ? 429 : 409;
    return json(status, { ok: false, error: 'request_rejected' });
  }

  logResult(requestId, 'accepted');
  return json(201, { ok: true, request_id: requestId });
});
