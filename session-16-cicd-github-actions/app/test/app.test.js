const test = require('node:test');
const assert = require('node:assert');
const { add, greet, createServer } = require('../src/app');

test('add() sums two numbers', () => {
  assert.strictEqual(add(2, 3), 5);
  assert.strictEqual(add(-1, 1), 0);
});

test('add() rejects non-numbers', () => {
  assert.throws(() => add('2', 3), TypeError);
});

test('greet() uses the name or a default', () => {
  assert.strictEqual(greet('Siddhant'), 'Hello, Siddhant!');
  assert.strictEqual(greet('  '), 'Hello, DevOps!');
});

test('HTTP endpoints', async (t) => {
  const server = createServer().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => server.close());

  await t.test('GET /health returns ok', async () => {
    const res = await fetch(`${base}/health`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { status: 'ok' });
  });

  await t.test('GET /add?a=2&b=40 returns 42', async () => {
    const res = await fetch(`${base}/add?a=2&b=40`);
    assert.deepStrictEqual(await res.json(), { result: 42 });
  });

  await t.test('GET /add with bad input returns 400', async () => {
    const res = await fetch(`${base}/add?a=x&b=1`);
    assert.strictEqual(res.status, 400);
  });

  await t.test('unknown path returns 404', async () => {
    const res = await fetch(`${base}/nope`);
    assert.strictEqual(res.status, 404);
  });
});
