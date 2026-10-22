import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import worker from './worker.mjs';

globalThis.crypto ??= webcrypto;
const base = 'https://styles.example.workers.dev';
const css = '/*\n#NAME: Prova\n#VERSION: 1.00\n#NOTE: Tema locale\n#COMMENT: Test\n*/\nbody { color: green; }';
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const cookie = response => response.headers.get('set-cookie').split(';')[0];

function environment() {
  const values = new Map();
  return {
    PUBLIC_BASE_URL: base, GITHUB_CLIENT_ID: 'Iv1.test', GITHUB_CLIENT_SECRET: 'test-secret',
    GITHUB_REPOSITORY_ID: '1389294896', SESSION_KEY: btoa('x'.repeat(32)),
    SESSIONS: { async get(key) { return values.get(key) ?? null; }, async put(key, value) { values.set(key, value); }, async delete(key) { values.delete(key); } },
    ASSETS: { async fetch() { return new Response('Pagina gestione'); } }, values,
  };
}

function request(path, options = {}) {
  return new Request(base + path, options);
}

async function login(env, fetcher, id = 10722164) {
  const start = await worker.fetch(request('/auth/login'), env);
  assert.equal(start.status, 302);
  const authorization = new URL(start.headers.get('location'));
  const state = authorization.searchParams.get('state');
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorization.searchParams.get('code_challenge').length, 43);
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (String(url) === 'https://github.com/login/oauth/access_token') {
      const body = new URLSearchParams(options.body);
      assert.equal(body.get('client_secret'), 'test-secret');
      assert.equal(body.get('repository_id'), '1389294896');
      const verifier = body.get('code_verifier');
      const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
      assert.equal(challenge, authorization.searchParams.get('code_challenge'));
      return json({ access_token: 'github-secret-token', token_type: 'bearer', expires_in: 3600 });
    }
    if (String(url).endsWith('/user')) return json({ id, login: id === 10722164 ? 'Roccobot' : 'altro' });
    if (String(url).endsWith('/repos/Roccobot/RoccobotOS')) return json({ id: 1389294896, owner: { id: 10722164 }, permissions: { push: true } });
    return fetcher?.(url, options) ?? Promise.reject(new Error('Unexpected fetch.'));
  };
  try {
    const callback = await worker.fetch(request(`/auth/callback?code=valid-code&state=${state}`, { headers: { Cookie: cookie(start) } }), env);
    if (id !== 10722164) return callback;
    assert.equal(callback.status, 302);
    assert.equal(callback.headers.get('location'), base + '/manage.html');
    assert.match(callback.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
    const sessionCookie = callback.headers.get('set-cookie').split(',').find(value => value.trim().startsWith('__Host-styles_session=')).trim().split(';')[0];
    const session = await worker.fetch(request('/auth/session', { headers: { Cookie: sessionCookie } }), env);
    const payload = await session.json();
    assert.deepEqual(payload.user, { login: 'Roccobot' });
    assert.equal(JSON.stringify(payload).includes('github-secret-token'), false);
    assert.equal([...env.values.values()].some(value => value.includes('github-secret-token')), false);
    return { sessionCookie, csrf: payload.csrf };
  } finally { globalThis.fetch = original; }
}

test('configuration fails closed before serving the manager', async () => {
  assert.equal((await worker.fetch(request('/manage.html'), {})).status, 503);
});

test('anonymous requests cannot read a session or upload', async () => {
  const env = environment();
  assert.equal((await worker.fetch(request('/auth/session'), env)).status, 401);
  assert.equal((await worker.fetch(request('/styles', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}' }), env)).status, 401);
});

test('OAuth binds state to its HttpOnly cookie and never exchanges an invalid state', async () => {
  const env = environment();
  const start = await worker.fetch(request('/auth/login'), env);
  assert.match(start.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const bad = await worker.fetch(request('/auth/callback?code=code&state=invalid', { headers: { Cookie: cookie(start) } }), env);
  assert.equal(bad.status, 400);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const noCookie = await worker.fetch(request(`/auth/callback?code=code&state=${state}`), env);
  assert.equal(noCookie.status, 400);
});

test('OAuth checks PKCE and restricts the immutable GitHub account ID', async () => {
  const denied = await login(environment(), undefined, 12);
  assert.equal(denied.status, 403);
  const env = environment();
  await login(env);
});

test('mutations reject a foreign or missing origin and a missing or wrong CSRF token', async () => {
  const env = environment(), session = await login(env);
  for (const headers of [
    { Origin: 'https://evil.example', 'X-CSRF-Token': session.csrf },
    { 'X-CSRF-Token': session.csrf }, { Origin: base }, { Origin: base, 'X-CSRF-Token': 'wrong' },
  ]) {
    const response = await worker.fetch(request('/styles', { method: 'POST', headers: { Cookie: session.sessionCookie, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ filename: 'New.css', content: css }) }), env);
    assert.equal(response.status, 403);
  }
});

test('logout removes the server session and clears its cookie', async () => {
  const env = environment(), session = await login(env);
  const logout = await worker.fetch(request('/auth/logout', { method: 'POST', headers: { Cookie: session.sessionCookie, Origin: base, 'X-CSRF-Token': session.csrf } }), env);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await worker.fetch(request('/auth/session', { headers: { Cookie: session.sessionCookie } }), env)).status, 401);
});

function repositoryMock({ conflict = false, existing = false, account = 10722164, malformed = false } = {}) {
  let generation = 0, blob = 0;
  const trees = [], commits = [], updates = [], blobs = new Map();
  const fetcher = async (url, options = {}) => {
    const path = new URL(url).pathname, method = options.method ?? 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    assert.equal(options.headers.Authorization, 'Bearer github-secret-token');
    if (path === '/user') return json({ id: account, login: account === 10722164 ? 'Roccobot' : 'attacker' });
    if (path.endsWith('/git/ref/heads/main')) return json({ object: { sha: `head${generation}` } });
    if (/\/git\/commits\/head/.test(path)) return json({ tree: { sha: `root${generation}` } });
    if (/\/git\/trees\/root/.test(path)) return json({ tree: [{ path: 'Styles', type: 'tree', sha: `styles${generation}` }] });
    if (/\/git\/trees\/styles/.test(path)) return json({ tree: [
      ...(existing ? [{ path: 'New.css', type: 'blob', sha: 'existing' }] : []),
      ...(generation ? [{ path: 'Concurrent.css', type: 'blob', sha: 'concurrent' }] : []),
      { path: 'index.json', type: 'blob', sha: `catalog${generation}` },
    ] });
    if (/\/git\/blobs\/catalog/.test(path)) return json({ encoding: 'base64', content: Buffer.from(malformed ? '{}' : JSON.stringify({ styles: generation ? [{ file: 'Concurrent.css', name: 'Concorrenza', version: '1.00', note: 'n', comment: 'c' }] : [] })).toString('base64') });
    if (method === 'POST' && path.endsWith('/git/blobs')) { const sha = `blob${++blob}`; blobs.set(sha, body.content); return json({ sha }, 201); }
    if (method === 'POST' && path.endsWith('/git/trees')) { trees.push(body); return json({ sha: `newtree${generation}` }, 201); }
    if (method === 'POST' && path.endsWith('/git/commits')) { commits.push(body); return json({ sha: `newcommit${generation}` }, 201); }
    if (method === 'PATCH' && path.endsWith('/git/refs/heads/main')) {
      updates.push(body);
      if (conflict && generation++ === 0) return json({ message: 'not a fast forward' }, 422);
      return json({ object: { sha: body.sha } });
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  };
  return { fetcher, trees, commits, updates, blobs };
}

async function upload(env, session, mock, filename = 'New.css', content = css) {
  const original = globalThis.fetch;
  globalThis.fetch = mock.fetcher;
  try { return await worker.fetch(request('/styles', { method: 'POST', headers: { Cookie: session.sessionCookie, Origin: base, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, content }) }), env); }
  finally { globalThis.fetch = original; }
}

test('upload atomically commits CSS and catalogue with a non-forced ref update', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock();
  const response = await upload(env, session, mock);
  assert.equal(response.status, 201);
  assert.equal(mock.trees.length, 1);
  assert.equal(mock.trees[0].base_tree, 'root0');
  assert.deepEqual(mock.trees[0].tree.map(entry => entry.path), ['Styles/New.css', 'Styles/index.json']);
  assert.deepEqual(mock.commits[0].parents, ['head0']);
  assert.deepEqual(mock.updates, [{ sha: 'newcommit0', force: false }]);
  const catalog = JSON.parse(mock.blobs.get(mock.trees[0].tree[1].sha));
  assert.equal(catalog.styles[0].file, 'New.css');
  assert.equal(catalog.styles[0].name, 'Prova');
});

test('concurrent changes are rebased and preserved before retrying the ref update', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock({ conflict: true });
  assert.equal((await upload(env, session, mock)).status, 201);
  assert.equal(mock.trees[1].base_tree, 'root1');
  assert.deepEqual(mock.commits[1].parents, ['head1']);
  const catalog = JSON.parse(mock.blobs.get(mock.trees[1].tree[1].sha));
  assert.deepEqual(catalog.styles.map(style => style.file).sort(), ['Concurrent.css', 'New.css']);
  assert.equal(mock.updates.every(update => update.force === false), true);
});

test('an existing CSS is rejected without any writes', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock({ existing: true });
  assert.equal((await upload(env, session, mock)).status, 409);
  assert.equal(mock.blobs.size, 0);
  assert.equal(mock.updates.length, 0);
});

test('the current GitHub identity is rechecked before writes', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock({ account: 9 });
  assert.equal((await upload(env, session, mock)).status, 403);
  assert.equal(mock.blobs.size, 0);
});

test('invalid filenames, external resources, and oversized content are rejected', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock();
  for (const [filename, content, status] of [['../New.css', css, 400], ['New.css', css + '\n@import "https://evil.example/x.css";', 400], ['New.css', 'a'.repeat(262145), 413]]) {
    assert.equal((await upload(env, session, mock, filename, content)).status, status);
  }
  assert.equal(mock.blobs.size, 0);
});

test('untrusted errors do not expose credentials', async () => {
  const env = environment(), session = await login(env);
  const response = await upload(env, session, { fetcher() { throw new Error('github-secret-token test-secret'); } });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('secret'), false);
});

test('a malformed existing catalogue stops the upload before creating blobs', async () => {
  const env = environment(), session = await login(env), mock = repositoryMock({ malformed: true });
  assert.equal((await upload(env, session, mock)).status, 502);
  assert.equal(mock.blobs.size, 0);
});

test('a streamed body without Content-Length is bounded and cancelled', async () => {
  const env = environment(), session = await login(env);
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(262144)); },
    cancel() { cancelled = true; },
  });
  const response = await worker.fetch(request('/styles', { method: 'POST', duplex: 'half', headers: { Cookie: session.sessionCookie, Origin: base, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' }, body: stream }), env);
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
});

test('the manager has security headers and no cross-origin permission', async () => {
  const env = environment();
  const response = await worker.fetch(request('/manage.html'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.has('access-control-allow-origin'), false);
  assert.equal((await worker.fetch(request('/worker.mjs'), env)).status, 404);
  const config = await worker.fetch(request('/config.json'), env);
  assert.deepEqual(await config.json(), { apiBase: base });
});

test('a captured OAuth callback cannot create a second session', async () => {
  const env = environment();
  const start = await worker.fetch(request('/auth/login'), env);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ error: 'bad_verification_code' });
  try {
    const first = await worker.fetch(request(`/auth/callback?code=invalid-code&state=${state}`, { headers: { Cookie: cookie(start) } }), env);
    assert.equal(first.status, 502);
    const replay = await worker.fetch(request(`/auth/callback?code=invalid-code&state=${state}`, { headers: { Cookie: cookie(start) } }), env);
    assert.equal(replay.status, 400);
  } finally { globalThis.fetch = original; }
});
