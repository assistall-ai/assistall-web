import assert from 'node:assert/strict';
import test from 'node:test';

const validation = await import('../supabase/functions/demo-ingest/validation.js').catch(() => ({}));

test('signed ingest payload validation normalises the accepted server contract', () => {
  assert.equal(typeof validation.validateInternalPayload, 'function');

  const result = validation.validateInternalPayload({
    name: '  Amina Noor ',
    email: ' AMINA@example.com ',
    company: ' Clear Route ',
    work_need: ' Shipment status changes ',
    ip: '203.0.113.40',
    source: 'assistall.ai',
  });

  assert.deepEqual(result, {
    name: 'Amina Noor',
    email: 'amina@example.com',
    company: 'Clear Route',
    workNeed: 'Shipment status changes',
    ip: '203.0.113.40',
    source: 'assistall.ai',
  });
});

test('signed ingest payload validation rejects malformed and oversized fields', () => {
  assert.equal(typeof validation.validateInternalPayload, 'function');

  assert.throws(() => validation.validateInternalPayload({ name: '', email: 'bad', company: '', work_need: '', ip: '', source: '' }), /invalid_payload/);
  assert.throws(() => validation.validateInternalPayload({ name: 'A', email: 'a@example.com', company: 'B', work_need: 'x'.repeat(2001), ip: '203.0.113.40', source: 'assistall.ai' }), /invalid_payload/);
});

test('request timestamps are accepted for sixty seconds and rejected outside the window', () => {
  assert.equal(typeof validation.isFreshTimestamp, 'function');

  assert.equal(validation.isFreshTimestamp(1_000_000, 950_000), true);
  assert.equal(validation.isFreshTimestamp(1_000_000, 939_999), false);
  assert.equal(validation.isFreshTimestamp(1_000_000, 1_061_000), false);
});

test('HMAC verification accepts the canonical signature and rejects tampering', async () => {
  assert.equal(typeof validation.signHmac, 'function');
  assert.equal(typeof validation.verifyHmacSignature, 'function');

  const secret = 'test-secret-with-enough-entropy';
  const timestamp = '1000000';
  const requestId = '9ba68c66-f2b1-45db-908e-8a8f57d2712e';
  const body = '{"name":"Amina"}';
  const signature = await validation.signHmac(secret, timestamp, requestId, body);

  assert.equal(await validation.verifyHmacSignature(secret, signature, timestamp, requestId, body), true);
  assert.equal(await validation.verifyHmacSignature(secret, signature, timestamp, requestId, `${body} `), false);
});

test('abuse identifiers are salted before storage', async () => {
  assert.equal(typeof validation.hashIdentifier, 'function');

  const first = await validation.hashIdentifier('203.0.113.40', 'salt-one');
  const second = await validation.hashIdentifier('203.0.113.40', 'salt-two');

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.notEqual(first, '203.0.113.40');
});
