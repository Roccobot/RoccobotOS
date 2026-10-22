/* Author: Rocco Casadei, a.k.a. Roccobot. */
import { compareStyles, validateUpload, readMetadata } from '../../styles-core.mjs';

const REPOSITORY = '/repos/Roccobot/RoccobotOS';
const REPOSITORY_ID = '1389294896';
const USER_ID = 10722164;
const SESSION_COOKIE = '__Host-styles_session';
const OAUTH_COOKIE = '__Host-styles_oauth';
const SESSION_SECONDS = 3600;
const OAUTH_SECONDS = 600;
const MAX_CSS_BYTES = 262144;
const MAX_BODY_BYTES = MAX_CSS_BYTES * 6 + 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const assets = new Set(['/manage.html', '/manage.mjs', '/manager.css', '/styles-core.mjs']);

class Failure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

function base64url(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function unbase64(value) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
}

function random() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
async function hash(value) { return base64url(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}

function cookies(request) {
  return Object.fromEntries((request.headers.get('Cookie') ?? '').split(';').map(part => part.trim().split(/=(.*)/s).slice(0, 2)).filter(pair => pair.length === 2));
}

function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`;
}

async function configuration(env) {
  try {
    const url = new URL(env.PUBLIC_BASE_URL);
    if (url.protocol !== 'https:' || url.origin !== env.PUBLIC_BASE_URL || !env.GITHUB_CLIENT_ID?.trim() || !env.GITHUB_CLIENT_SECRET?.trim() || env.GITHUB_REPOSITORY_ID !== REPOSITORY_ID || !env.SESSIONS?.get || !env.SESSIONS?.put || !env.SESSIONS?.delete || !env.ASSETS?.fetch) throw new Error();
    const keyBytes = unbase64(env.SESSION_KEY);
    if (keyBytes.length !== 32) throw new Error();
    return { origin: url.origin, key: await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']) };
  } catch { throw new Failure(503, 'La gestione degli stili non è ancora configurata.'); }
}

async function save(env, config, key, value, seconds) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(key) }, config.key, encoder.encode(JSON.stringify(value)));
  await env.SESSIONS.put(key, `${base64url(iv)}.${base64url(data)}`, { expirationTtl: seconds });
}

async function load(env, config, key) {
  const stored = await env.SESSIONS.get(key);
  if (!stored) return null;
  try {
    const [iv, data] = stored.split('.');
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv), additionalData: encoder.encode(key) }, config.key, unbase64(data));
    const value = JSON.parse(decoder.decode(plaintext));
    return value.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}

async function session(request, env, config) {
  const value = cookies(request)[SESSION_COOKIE];
  if (!/^[A-Za-z0-9_-]{43}$/.test(value ?? '')) throw new Failure(401, 'Accedi con GitHub per continuare.');
  const key = `session:${await hash(value)}`;
  const result = await load(env, config, key);
  if (!result || result.user?.id !== USER_ID) throw new Failure(401, 'La sessione è scaduta. Accedi di nuovo.');
  return { ...result, key };
}

function checkOrigin(request, config, required = false) {
  const origin = request.headers.get('Origin');
  if ((required || origin !== null) && origin !== config.origin) throw new Failure(403, 'Origine della richiesta non consentita.');
}

async function mutation(request, env, config) {
  checkOrigin(request, config, true);
  const current = await session(request, env, config);
  if (!equal(request.headers.get('X-CSRF-Token'), current.csrf)) throw new Failure(403, 'Richiesta non autorizzata. Ricarica la pagina.');
  return current;
}

async function github(path, token, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`https://api.github.com${path}`, {
      method, redirect: 'error', headers: {
        Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'RoccobotOS-styles',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      }, ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Failure(502, 'GitHub non è raggiungibile. Riprova.'); }
  if (response.status === 401) throw new Failure(401, 'GitHub richiede un nuovo accesso.');
  if (!response.ok) throw new Failure(response.status === 409 || response.status === 422 ? 409 : 502, 'GitHub non ha completato il salvataggio.');
  try { return await response.json(); }
  catch { throw new Failure(502, 'GitHub ha restituito una risposta non valida.'); }
}

async function identity(token) {
  const user = await github('/user', token);
  if (user.id !== USER_ID || typeof user.login !== 'string') throw new Failure(403, 'Può accedere solo l\'account GitHub Roccobot.');
  return { id: user.id, login: user.login };
}

async function login(request, env, config) {
  const state = random(), nonce = random(), verifier = random();
  await save(env, config, `oauth:${await hash(state)}`, { nonce: await hash(nonce), verifier, expiresAt: Date.now() + OAUTH_SECONDS * 1000 }, OAUTH_SECONDS);
  const url = new URL('https://github.com/login/oauth/authorize');
  for (const [key, value] of Object.entries({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${config.origin}/auth/callback`, state, login: 'Roccobot', allow_signup: 'false', code_challenge: await hash(verifier), code_challenge_method: 'S256' })) url.searchParams.set(key, value);
  return new Response(null, { status: 302, headers: { Location: url.href, 'Set-Cookie': cookie(OAUTH_COOKIE, nonce, OAUTH_SECONDS) } });
}

async function callback(request, env, config) {
  const url = new URL(request.url), state = url.searchParams.get('state'), code = url.searchParams.get('code'), nonce = cookies(request)[OAUTH_COOKIE];
  if (!/^[A-Za-z0-9_-]{43}$/.test(state ?? '') || !/^[A-Za-z0-9_-]{43}$/.test(nonce ?? '') || !code || code.length > 1024 || url.searchParams.has('error')) throw new Failure(400, 'Accesso non completato. Torna alla gestione e riprova.');
  const key = `oauth:${await hash(state)}`, flow = await load(env, config, key);
  if (!flow || !equal(flow.nonce, await hash(nonce))) throw new Failure(400, 'Accesso scaduto o non valido. Avvia un nuovo accesso.');
  await env.SESSIONS.delete(key);
  let token;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', redirect: 'error', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'RoccobotOS-styles' },
      body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${config.origin}/auth/callback`, code_verifier: flow.verifier, repository_id: REPOSITORY_ID }).toString(),
    });
    if (!response.ok) throw new Error();
    token = await response.json();
    if (typeof token.access_token !== 'string' || token.token_type?.toLowerCase() !== 'bearer' || token.error) throw new Error();
  } catch { throw new Failure(502, 'GitHub non ha completato l\'accesso. Riprova.'); }
  const user = await identity(token.access_token);
  const repo = await github(REPOSITORY, token.access_token);
  if (String(repo.id) !== REPOSITORY_ID || repo.owner?.id !== USER_ID || repo.permissions?.push !== true) throw new Failure(403, 'L\'app GitHub non può scrivere in RoccobotOS.');
  const seconds = Math.min(SESSION_SECONDS, Number.isFinite(token.expires_in) ? Math.floor(token.expires_in) : SESSION_SECONDS);
  if (seconds < 60) throw new Failure(401, 'Accesso GitHub scaduto. Riprova.');
  const opaque = random();
  await save(env, config, `session:${await hash(opaque)}`, { token: token.access_token, user, csrf: random(), expiresAt: Date.now() + seconds * 1000 }, seconds);
  const headers = new Headers({ Location: `${config.origin}/manage.html` });
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, opaque, seconds));
  headers.append('Set-Cookie', cookie(OAUTH_COOKIE, '', 0));
  return new Response(null, { status: 302, headers });
}

async function readBody(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new Failure(415, 'Invia il file nel formato previsto dalla pagina.');
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new Failure(413, 'Il limite per ogni stile è 256 KiB.');
  const reader = request.body?.getReader();
  if (!reader) throw new Failure(400, 'Manca il file CSS.');
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) { await reader.cancel(); throw new Failure(413, 'Il limite per ogni stile è 256 KiB.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.byteLength; }
  try {
    const value = JSON.parse(decoder.decode(bytes));
    if (!value || Array.isArray(value) || typeof value.filename !== 'string' || typeof value.content !== 'string') throw new Error();
    if (encoder.encode(value.content).length > MAX_CSS_BYTES) throw new Failure(413, 'Il limite per ogni stile è 256 KiB.');
    return value;
  } catch (error) {
    if (error instanceof Failure) throw error;
    throw new Failure(400, 'Il file inviato non è valido.');
  }
}

async function tree(sha, token) {
  const result = await github(`${REPOSITORY}/git/trees/${encodeURIComponent(sha)}`, token);
  if (!Array.isArray(result.tree) || result.truncated) throw new Failure(502, 'La cartella degli stili non è leggibile.');
  return result.tree;
}

async function blobText(sha, token) {
  const result = await github(`${REPOSITORY}/git/blobs/${encodeURIComponent(sha)}`, token);
  try {
    if (result.encoding !== 'base64' || typeof result.content !== 'string' || result.content.length > 8 * 1024 * 1024) throw new Error();
    return decoder.decode(unbase64(result.content.replaceAll('\n', '')));
  } catch { throw new Failure(502, 'Il catalogo degli stili non è leggibile.'); }
}

async function catalogue(entries, token) {
  const cssFiles = entries.filter(entry => /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.css$/.test(entry.path) && entry.type === 'blob');
  const manifest = entries.find(entry => entry.path === 'index.json');
  if (!manifest) {
    const result = [];
    for (const entry of cssFiles) {
      try { result.push({ file: entry.path, ...readMetadata(await blobText(entry.sha, token)) }); }
      catch { throw new Failure(502, 'Uno stile esistente ha un\'intestazione non valida.'); }
    }
    return result;
  }
  try {
    const parsed = JSON.parse(await blobText(manifest.sha, token));
    if (manifest.type !== 'blob' || !Array.isArray(parsed.styles) || parsed.styles.length !== cssFiles.length) throw new Error();
    const names = new Set();
    for (const style of parsed.styles) {
      if (!style || names.has(style.file) || !cssFiles.some(entry => entry.path === style.file) || ['name', 'version', 'note', 'comment'].some(key => typeof style[key] !== 'string')) throw new Error();
      names.add(style.file);
    }
    return parsed.styles;
  } catch { throw new Failure(502, 'Il catalogo esistente non è valido. Rigeneralo prima di aggiungere uno stile.'); }
}

async function upload(request, env, config) {
  const current = await mutation(request, env, config);
  const input = await readBody(request);
  let style;
  try { style = validateUpload(input.filename, input.content); }
  catch (error) { throw new Failure(400, error.message); }
  await identity(current.token);
  const metadata = { file: style.filename, name: style.name, version: style.version, note: style.note, comment: style.comment };
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await github(`${REPOSITORY}/git/ref/heads/main`, current.token);
    const parent = ref.object?.sha;
    if (!parent) throw new Failure(502, 'Il ramo principale non è leggibile.');
    const commit = await github(`${REPOSITORY}/git/commits/${encodeURIComponent(parent)}`, current.token);
    const base = commit.tree?.sha;
    if (!base) throw new Failure(502, 'Il ramo principale non è leggibile.');
    const rootEntries = await tree(base, current.token);
    const directory = rootEntries.find(entry => entry.path === 'Styles');
    if (directory && directory.type !== 'tree') throw new Failure(409, 'Styles esiste già e non è una cartella.');
    const entries = directory ? await tree(directory.sha, current.token) : [];
    if (entries.some(entry => entry.path.toLowerCase() === style.filename.toLowerCase())) throw new Failure(409, 'Esiste già un file con questo nome. Scegli un altro nome.');
    const styles = [...await catalogue(entries, current.token), metadata];
    styles.sort(compareStyles);
    const cssBlob = await github(`${REPOSITORY}/git/blobs`, current.token, 'POST', { content: style.content, encoding: 'utf-8' });
    const indexBlob = await github(`${REPOSITORY}/git/blobs`, current.token, 'POST', { content: JSON.stringify({ styles }, null, 2) + '\n', encoding: 'utf-8' });
    const newTree = await github(`${REPOSITORY}/git/trees`, current.token, 'POST', { base_tree: base, tree: [
      { path: `Styles/${style.filename}`, mode: '100644', type: 'blob', sha: cssBlob.sha },
      { path: 'Styles/index.json', mode: '100644', type: 'blob', sha: indexBlob.sha },
    ] });
    const newCommit = await github(`${REPOSITORY}/git/commits`, current.token, 'POST', { message: `Aggiunge lo stile ${style.name}\n\nAgent: Codex`, tree: newTree.sha, parents: [parent] });
    try {
      await github(`${REPOSITORY}/git/refs/heads/main`, current.token, 'PATCH', { sha: newCommit.sha, force: false });
      return json({ style: { filename: style.filename, ...metadata }, commit: newCommit.sha, url: `https://github.com/Roccobot/RoccobotOS/blob/main/Styles/${style.filename}` }, 201);
    } catch (error) {
      if (!(error instanceof Failure) || error.status !== 409) throw error;
      if (attempt === 2) throw new Failure(409, 'Il repository è cambiato durante il salvataggio. Riprova.');
    }
  }
}

async function route(request, env, config) {
  const url = new URL(request.url);
  if (url.origin !== config.origin) throw new Failure(400, 'Indirizzo della gestione non valido.');
  checkOrigin(request, config);
  if (request.method === 'GET' && url.pathname === '/auth/login') return login(request, env, config);
  if (request.method === 'GET' && url.pathname === '/auth/callback') return callback(request, env, config);
  if (request.method === 'GET' && url.pathname === '/auth/session') {
    const current = await session(request, env, config);
    return json({ user: { login: current.user.login }, csrf: current.csrf });
  }
  if (request.method === 'POST' && url.pathname === '/auth/logout') {
    const current = await mutation(request, env, config);
    await env.SESSIONS.delete(current.key);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0) });
  }
  if (request.method === 'POST' && url.pathname === '/styles') return upload(request, env, config);
  if (request.method === 'GET' && url.pathname === '/config.json') return json({ apiBase: config.origin });
  if (request.method === 'GET' && url.pathname === '/') return new Response(null, { status: 302, headers: { Location: `${config.origin}/manage.html` } });
  if (['GET', 'HEAD'].includes(request.method) && assets.has(url.pathname)) return env.ASSETS.fetch(request);
  throw new Failure(404, 'Pagina non trovata.');
}

export default {
  async fetch(request, env) {
    let response;
    try { response = await route(request, env, await configuration(env)); }
    catch (error) {
      response = json({ error: error instanceof Failure ? error.message : 'Il servizio non ha completato la richiesta. Riprova.' }, error instanceof Failure ? error.status : 502);
      if (new URL(request.url).pathname === '/auth/callback') response.headers.append('Set-Cookie', cookie(OAUTH_COOKIE, '', 0));
    }
    const secured = new Response(response.body, response);
    secured.headers.set('Cache-Control', 'no-store');
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('Referrer-Policy', 'no-referrer');
    secured.headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    return secured;
  },
};
