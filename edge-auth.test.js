import test from 'node:test';
import assert from 'node:assert/strict';
import middleware from './middleware.js';
import { createSession, readSessionFromToken, encodePayload, sign, isCmsAdmin, SESSION_MS, IDLE_SESSION_MS } from './src/utils/session.js';

const secret = 'edge-auth-test-secret';

function setup(t, admins = '') {
    const saved = { AUTH_SECRET: process.env.AUTH_SECRET, CMS_ADMIN_EMAILS: process.env.CMS_ADMIN_EMAILS };
    process.env.AUTH_SECRET = secret;
    process.env.CMS_ADMIN_EMAILS = admins;
    t.after(() => {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    });
}

function signed(payload) {
    return `${payload}.${sign(secret, payload)}`;
}

function visit(token, path = '/index.html') {
    return middleware(new Request(`https://example.test${path}`, {
        headers: token === undefined ? {} : { Cookie: `other=value; kb_session=${token}` },
    }));
}

async function refreshed(response) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const cookie = response.headers.get('set-cookie');
    assert.ok(cookie);
    assert.match(cookie, /; HttpOnly; SameSite=Lax; Max-Age=43200; Secure$/);
    const token = cookie.split(';')[0].slice('kb_session='.length);
    assert.match(token.split('.')[0], /^[A-Za-z0-9_-]+$/);
    const session = await readSessionFromToken(token, secret);
    assert.ok(session);
    assert.equal(token.split('.')[0], Buffer.from(JSON.stringify(session)).toString('base64url'));
    return { token, session };
}

for (const provider of ['manual', 'supabase']) {
    for (const admin of ['role', 'allowlist']) {
        test(`${provider} Unicode Node session survives edge refresh with ${admin} admin access`, async (t) => {
            const user = { id: '用户-é-\u{1F680}', provider, email: 'élève@example.test', name: 'Zoë 中文 العربية \u{1F680}', role: admin === 'role' ? 'admin' : 'user' };
            setup(t, admin === 'allowlist' ? ` ${user.email.toUpperCase()} ` : '');
            const token = await createSession(secret, user);
            const original = await readSessionFromToken(token, secret);
            const before = Date.now();
            const result = await refreshed(await visit(token, '/admin.html'));
            assert.deepEqual(result.session, { ...original, a: result.session.a });
            assert.ok(result.session.a >= before);
            assert.equal(isCmsAdmin(result.session), true);
            const again = await refreshed(await visit(result.token, '/admin.html'));
            assert.deepEqual(again.session, { ...result.session, a: again.session.a });
        });
    }
}

for (const identity of ['u', 'e']) {
    for (const activity of [false, true]) {
        test(`legacy ${identity} cookie ${activity ? 'with' : 'without'} activity refreshes`, async (t) => {
            setup(t);
            const now = Date.now();
            const original = { [identity]: 'legacy@example.test', n: 'Legacy Reader', r: 'admin', exp: now + SESSION_MS - 60000, ...(activity ? { a: now - 60000 } : {}) };
            const { session } = await refreshed(await visit(signed(encodePayload(original)), '/admin.html'));
            assert.deepEqual(session, { e: original[identity], n: original.n, r: 'admin', a: session.a, exp: original.exp });
            assert.ok(session.a >= now);
            assert.equal(isCmsAdmin(session), true);
        });
    }
}

test('non-admin remains denied after refresh', async (t) => {
    setup(t);
    const token = await createSession(secret, { id: 'reader', provider: 'manual', email: 'reader', name: 'Reader', role: 'user' });
    const result = await refreshed(await visit(token));
    assert.equal(isCmsAdmin(result.session), false);
    const denied = await visit(result.token, '/admin.html');
    assert.equal(denied.status, 302);
    assert.equal(denied.headers.get('location'), 'https://example.test/index.html');
    assert.equal(denied.headers.get('set-cookie'), null);
});

test('invalid and tampered cookies are rejected without refresh', async (t) => {
    setup(t);
    const now = Date.now();
    const valid = { e: 'reader@example.test', r: 'user', a: now, exp: now + SESSION_MS };
    const payload = encodePayload(valid);
    const token = signed(payload);
    const cases = {
        missing: undefined,
        empty: '',
        malformed: 'not-a-token',
        signature: `${payload}.${'0'.repeat(64)}`,
        truncated: token.slice(0, -1),
        tampered: `${encodePayload({ ...valid, r: 'admin' })}.${sign(secret, payload)}`,
        base64: signed('%%%'),
        json: signed(Buffer.from('not json').toString('base64url')),
        null: signed(encodePayload(null)),
        expiryType: signed(encodePayload({ ...valid, exp: String(valid.exp) })),
        expired: signed(encodePayload({ ...valid, exp: now - 1000 })),
        idle: signed(encodePayload({ ...valid, a: now - IDLE_SESSION_MS })),
        legacyIdle: signed(encodePayload({ e: valid.e, exp: now + SESSION_MS - IDLE_SESSION_MS })),
    };
    for (const [label, cookie] of Object.entries(cases)) {
        const response = await visit(cookie);
        assert.equal(response.status, 302, label);
        assert.equal(new URL(response.headers.get('location')).pathname, '/login.html', label);
        assert.equal(response.headers.get('set-cookie'), null, label);
        const admin = await visit(cookie, '/admin.html');
        assert.equal(admin.status, 302, label);
        assert.equal(new URL(admin.headers.get('location')).pathname, '/index.html', label);
        assert.equal(admin.headers.get('set-cookie'), null, label);
    }
});
