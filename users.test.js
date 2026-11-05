import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('local PostgreSQL migration and real Argon2 user lifecycle', async (t) => {
  process.env.VERCEL = '1';
  process.env.AUTH_SECRET = 'integration-secret';
  process.env.MANUAL_USERS = JSON.stringify({ owner: { password: 'original-password', role: 'admin' } });
  process.env.SUPABASE_URL = 'https://database.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
  process.env.SUPABASE_ANON_KEY = '';
  const db = new PGlite();
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  await db.exec(await readFile(new URL('./sql/kb_users.sql', import.meta.url), 'utf8'));
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input);
    if (url.hostname !== 'database.invalid') return realFetch(input, options);
    const body = options.body ? JSON.parse(options.body) : {};
    try {
      let data;
      if (url.pathname.endsWith('/kb_action_limit')) data = (await db.query('SELECT kb_action_limit($1,$2,$3) AS value', [body.p_key, body.p_limit, body.p_seconds])).rows[0].value;
      else if (url.pathname.endsWith('/kb_mutate_user')) data = (await db.query('SELECT kb_mutate_user($1,$2,$3,$4,$5) AS value', [body.p_action, body.p_id, body.p_data, body.p_actor, body.p_manual_admin])).rows[0].value;
      else if (url.pathname.endsWith('/kb_users')) {
        const field = url.searchParams.has('id') ? 'id' : url.searchParams.has('username') ? 'username' : null;
        data = (await db.query(`SELECT * FROM kb_users${field ? ` WHERE ${field} = $1` : ''}`, field ? [url.searchParams.get(field).slice(3)] : [])).rows;
        if (url.searchParams.get('select') !== '*') data = data.map(({ password_hash, ...user }) => user);
      } else if (url.pathname.endsWith('/cms_navigation')) data = [{ page: 'acceptance', title: 'Acceptance documentation', scope: 'stage', content: '<p>Documentation</p>' }];
      else data = [];
      return Response.json(data);
    } catch (error) { return Response.json({ message: error.message }, { status: 400 }); }
  };
  const { createApp } = await import('./server.js');
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => { globalThis.fetch = realFetch; server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); await db.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function send(path, method = 'GET', body, csrfOrigin = origin) {
    const response = await realFetch(origin + path, { method, redirect: 'manual', headers: { Cookie: cookie, Origin: csrfOrigin, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const updated = response.headers.get('set-cookie');
    if (updated) cookie = updated.split(';')[0];
    return response;
  }
  async function login(identity, password) { const response = await send('/api/login', 'POST', { identity, password }); assert.equal(response.status, 302); return response; }
  await login('owner', 'original-password');
  assert.equal((await send('/api/users/', 'POST', { username: 'owner', full_name: 'Collision', password: 'test-password-01' })).status, 400);
  assert.equal((await send('/api/users/', 'POST', {}, 'https://evil.invalid')).status, 403);
  assert.equal((await realFetch(origin + '/api/logout', { method: 'POST', headers: { Cookie: cookie }, redirect: 'manual' })).status, 403);
  const csrf = await (await send('/api/csrf')).json();
  const { refreshSession, readSessionFromToken } = await import('./src/utils/session.js');
  const currentSession = await readSessionFromToken(cookie.slice('kb_session='.length), process.env.AUTH_SECRET);
  cookie = `kb_session=${await refreshSession(process.env.AUTH_SECRET, { ...currentSession, a: 0 })}`;
  assert.equal((await realFetch(origin + '/api/logout', { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf.token }, redirect: 'manual' })).status, 302);
  const created = await send('/api/users/', 'POST', { username: 'testuser01', full_name: 'Test User', password: 'test-password-01', role: 'user' });
  assert.equal(created.status, 201);
  const user = await created.json();
  assert.equal(user.password_hash, undefined);
  assert.match((await db.query('SELECT password_hash FROM kb_users')).rows[0].password_hash, /^\$argon2id\$/);
  await send('/api/logout', 'POST');
  await login('testuser01', 'test-password-01');
  const oldCookie = cookie;
  assert.equal((await send('/index.html')).status, 200);
  assert.equal((await send('/docs/acceptance')).status, 200);
  assert.equal((await send('/users.html')).status, 302);
  const { default: middleware } = await import('./middleware.js');
  const edgeFetch = globalThis.fetch;
  globalThis.fetch = (input, options) => new URL(input).pathname === '/api/session' ? realFetch(origin + '/api/session', options) : edgeFetch(input, options);
  assert.equal((await middleware(new Request(origin + '/index', { headers: { cookie } }))).headers.get('x-middleware-next'), '1');
  globalThis.fetch = edgeFetch;
  assert.equal((await send('/api/users/')).status, 403);
  await db.query("UPDATE kb_users SET role = 'admin' WHERE id = $1", [user.id]);
  assert.equal((await send('/api/session')).status, 200);
  const listing = await (await send('/api/users/')).json();
  assert.equal(listing.users[0].password_hash, undefined);
  await db.query("UPDATE kb_users SET role = 'user' WHERE id = $1", [user.id]);
  assert.equal((await send('/api/users/')).status, 403);
  assert.equal((await send('/users')).status, 302);
  process.env.CMS_ADMIN_EMAILS = 'testuser01';
  assert.equal((await send('/api/users/')).status, 403);
  await send('/api/logout', 'POST');
  await login('owner', 'original-password');
  const adminCookie = cookie;
  assert.equal((await send(`/api/users/${user.id}`, 'PATCH', { password: 'new-password-02' })).status, 200);
  cookie = oldCookie;
  assert.equal((await send('/api/session')).status, 401);
  globalThis.fetch = (input, options) => new URL(input).pathname === '/api/session' ? realFetch(origin + '/api/session', options) : edgeFetch(input, options);
  assert.equal((await middleware(new Request(origin + '/index', { headers: { cookie: oldCookie } }))).status, 302);
  globalThis.fetch = edgeFetch;
  cookie = adminCookie;
  assert.equal((await send(`/api/users/${user.id}`, 'PATCH', { is_active: false })).status, 200);
  const rejected = await login('testuser01', 'new-password-02');
  assert.match(rejected.headers.get('location'), /error=invalid/);
  cookie = adminCookie;
  assert.equal((await send(`/api/users/${user.id}`, 'PATCH', { is_active: true, role: 'admin' })).status, 200);
  await login('testuser01', 'new-password-02');
  assert.equal((await send(`/api/users/${user.id}`, 'DELETE')).status, 409);
  assert.equal((await send(`/api/users/${user.id}`, 'PATCH', { is_active: false })).status, 409);
  process.env.MANUAL_USERS = '';
  process.env.CMS_ADMIN_EMAILS = '';
  assert.equal((await send(`/api/users/${user.id}`, 'PATCH', { role: 'user' })).status, 409);
  for (let i = 0; i < 10; i++) assert.equal((await db.query("SELECT kb_action_limit('limit-test',10,900) AS ok")).rows[0].ok, true);
  assert.equal((await db.query("SELECT kb_action_limit('limit-test',10,900) AS ok")).rows[0].ok, false);
  process.env.MANUAL_USERS = JSON.stringify({ owner: { password: 'original-password', role: 'admin' } });
  await send('/api/logout', 'POST');
  await login('owner', 'original-password');
  assert.equal((await send(`/api/users/${user.id}`, 'DELETE')).status, 200);
  assert.equal((await db.query('SELECT * FROM kb_users')).rows.length, 0);
  const inactive = await send('/api/users/', 'POST', { username: 'inactive', full_name: 'Inactive', password: 'test-password-03', is_active: false });
  assert.equal(inactive.status, 201);
  assert.equal((await inactive.json()).is_active, false);
  const admins = [];
  for (const username of ['adminone', 'admintwo']) {
    const response = await send('/api/users/', 'POST', { username, full_name: username, password: 'test-password-04', role: 'admin' });
    assert.equal(response.status, 201);
    admins.push(await response.json());
  }
  const demotions = await Promise.allSettled(admins.map((admin) => db.query(
    "SELECT kb_mutate_user('update', $1, '{\"role\":\"user\"}', $1, false)", [admin.id]
  )));
  assert.equal(demotions.filter((result) => result.status === 'fulfilled').length, 1);
  assert.match(demotions.find((result) => result.status === 'rejected').reason.message, /Last administrator/);
  assert.equal((await db.query("SELECT count(*)::integer AS count FROM kb_users WHERE role = 'admin' AND is_active")).rows[0].count, 1);
});
