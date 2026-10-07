const test = require('node:test');
const assert = require('node:assert');
const { createApp, validateNote } = require('../src/app');

test('validateNote() accepts normal text', () => {
  assert.strictEqual(validateNote('buy milk'), null);
});

test('validateNote() rejects empty and too-long text', () => {
  assert.match(validateNote('   '), /required/);
  assert.match(validateNote('x'.repeat(201)), /at most 200/);
});

test('HTTP API', async (t) => {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => server.close());

  await t.test('GET /health', async () => {
    const res = await fetch(`${base}/health`);
    assert.deepStrictEqual(await res.json(), { status: 'ok' });
  });

  await t.test('security headers are set and x-powered-by is hidden', async () => {
    const res = await fetch(`${base}/`);
    assert.strictEqual(res.headers.get('x-powered-by'), null);
    assert.ok(res.headers.get('content-security-policy'));
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  });

  await t.test('POST /notes creates a note', async () => {
    const res = await fetch(`${base}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'ship it securely' }),
    });
    assert.strictEqual(res.status, 201);
    assert.deepStrictEqual(await res.json(), { id: 1, text: 'ship it securely' });
  });

  await t.test('POST /notes with invalid input returns 400', async () => {
    const res = await fetch(`${base}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    assert.strictEqual(res.status, 400);
  });
});
