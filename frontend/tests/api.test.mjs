import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const { api } = await loadModule('api');
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('catalogue requests use the same-origin API without a request body', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/levels'); assert.equal(options.method, 'GET');
    assert.equal(options.body, undefined);
    return Response.json({ levels: [] });
  };
  assert.deepEqual(await api('/levels'), { levels: [] });
});
test('chat forwards exact multiline history, reply text and cancellation signal', async () => {
  const body = { level_id: 1, messages: [{ role: 'user', content: 'First line\nSecond line' }] };
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/chat'); assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), body); assert.equal(options.signal, controller.signal);
    assert.equal(options.headers['Content-Type'], 'application/json');
    return Response.json({ reply: '<b>plain text</b>' });
  };
  assert.deepEqual(await api('/chat', body, controller.signal), { reply: '<b>plain text</b>' });
});
test('validator results are forwarded without a client-side password comparison', async () => {
  for (const correct of [false, true]) {
    const result = { level_id: 1, correct, completed: correct };
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).password, 'arbitrary server decision');
      return Response.json(result);
    };
    assert.deepEqual(await api('/validate', { level_id: 1, password: 'arbitrary server decision' }), result);
  }
});
test('HTTP failures surface the backend error without hidden retries', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ error: 'Cannot reach local model service.' }, { status: 503 }); };
  await assert.rejects(api('/chat', {}), /Cannot reach local model service/);
  assert.equal(calls, 1);
});
test('HTTP errors without a message give useful feedback', async () => {
  globalThis.fetch = async () => Response.json({}, { status: 502 });
  await assert.rejects(api('/chat', {}), /unavailable/);
});
test('network failure can be followed by an explicit retry with identical payload', async () => {
  const requests = []; const body = { level_id: 1, messages: [{ role: 'user', content: 'Keep my text' }] };
  globalThis.fetch = async (_url, options) => {
    requests.push(options.body);
    if (requests.length === 1) throw new TypeError('Connection failed');
    return Response.json({ reply: 'Recovered' });
  };
  await assert.rejects(api('/chat', body), /Cannot connect/);
  assert.deepEqual(await api('/chat', body), { reply: 'Recovered' });
  assert.equal(requests.length, 2); assert.equal(requests[0], requests[1]);
});
test('malformed response JSON is a controlled error', async () => {
  globalThis.fetch = async () => new Response('not JSON', { status: 200 });
  await assert.rejects(api('/validate', {}), /invalid response/);
});
test('navigation cancellation remains an abort rather than a service error', async () => {
  const controller = new AbortController(); controller.abort();
  const cancellation = new DOMException('Aborted', 'AbortError');
  globalThis.fetch = async () => { throw cancellation; };
  await assert.rejects(api('/chat', {}, controller.signal), error => error === cancellation);
});
