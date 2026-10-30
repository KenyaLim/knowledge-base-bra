import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSession, readSessionFromToken, authenticateWithSupabase, isCmsAdmin } from './src/utils/session.js';
import { sameOrigin } from './src/middlewares/security.js';

test('database defaults, RLS, self and last administrator guards', async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text);");
    await db.exec(await readFile(new URL('./sql/user-management.sql', import.meta.url), 'utf8'));
    const a = '00000000-0000-4000-8000-000000000001';
    const b = '00000000-0000-4000-8000-000000000002';
    await db.query('insert into auth.users values ($1,$2),($3,$4)', [a,'a@example.test',b,'b@example.test']);
    assert.equal((await db.query('select role from public.kb_profiles where id=$1',[a])).rows[0].role,'user');
    await db.query("update public.kb_profiles set role='admin' where id=$1",[a]);
    await assert.rejects(db.query('delete from auth.users where id=$1',[a]), /Last active/);
    await assert.rejects(db.query("select public.kb_manage_user($1,$1,'','user','active')",[a]), /Self protection/);
    await assert.rejects(db.query("select public.kb_manage_user($1,$2,'','admin','active')",[b,a]), /Forbidden/);
    await db.query("update auth.users set email='changed@example.test' where id=$1",[b]);
    assert.equal((await db.query('select email from public.kb_profiles where id=$1',[b])).rows[0].email,'changed@example.test');
    for (let i=0;i<3;i++) assert.equal((await db.query("select public.kb_rate_limit('bucket',2,900) as allowed")).rows[0].allowed,i<2);
    await db.exec('set role authenticated');
    await assert.rejects(db.exec("update public.kb_profiles set role='admin'"), /permission denied/);
  } finally { await db.close(); }
});

test('provider parsing and live role/status revalidation fail closed', async () => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  process.env.SUPABASE_URL = 'https://provider.example.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock';
  process.env.CMS_ADMIN_EMAILS = 'user@example.test';
  const id = '00000000-0000-4000-8000-000000000001';
  let status = 'active';
  let version = 0;
  global.fetch = async (url) => Response.json(String(url).includes('/token?') ? { user: { id, user_metadata: { role: 'admin' } } } : [{ id, email:'user@example.test',name:'User',role:'user',status,session_version: version }]);
  try {
    const user = await authenticateWithSupabase(process.env.SUPABASE_URL,'mock','user@example.test','password');
    assert.equal(user.id,id); assert.equal(user.role,'user');
    const token = await createSession('test-secret',{ ...user, session_version: 0 });
    assert.equal(isCmsAdmin(await readSessionFromToken(token,'test-secret')),false);
    version = 1; assert.equal(await readSessionFromToken(token,'test-secret'),null);
    status = 'inactive'; assert.equal(await readSessionFromToken(token,'test-secret'),null);
    global.fetch = async () => { throw new Error('offline'); };
    assert.equal(await readSessionFromToken(token,'test-secret'),null);
  } finally { global.fetch = oldFetch; process.env = oldEnv; }
});

test('mutation origin checks reject missing and foreign origins', () => {
  const previous = process.env.APP_ORIGIN; process.env.APP_ORIGIN = 'https://app.example.test';
  try {
    for (const origin of [undefined,'https://evil.example.test','https://app.example.test']) {
      let allowed = false; let status;
      sameOrigin({ method:'POST', get: key => key === 'origin' ? origin : undefined }, { status(code) { status=code; return this; }, json() {} }, () => { allowed=true; });
      assert.equal(allowed,origin === process.env.APP_ORIGIN);
      if (!allowed) assert.equal(status,403);
    }
  } finally { if (previous === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN=previous; }
});
