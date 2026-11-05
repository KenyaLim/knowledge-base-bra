import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { request } from 'node:http';

const secret = 'phase-one-test-secret-not-for-production';
const upstream = 'https://supabase.invalid';
const password = 'fixture-password';
const sessionMs = 12 * 60 * 60 * 1000;
const fixtures = {
    AUTH_SECRET: secret,
    SUPABASE_URL: upstream,
    SUPABASE_ANON_KEY: 'fixture-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture-service',
    CMS_STORAGE_BUCKET: 'fixture-bucket',
    CMS_ADMIN_EMAILS: '',
    MANUAL_USERS: '',
    VERCEL: '1',
    DOTENV_CONFIG_PATH: '/dev/null',
};

function signedCookie(payload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `kb_session=${encoded}.${createHmac('sha256', secret).update(encoded).digest('hex')}`;
}

function cookieOf(response) {
    const cookie = response.headers['set-cookie']?.find((value) => value.startsWith('kb_session='));
    assert.ok(cookie, 'expected session cookie');
    return cookie.split(';')[0];
}

function payloadOf(response) {
    return JSON.parse(Buffer.from(cookieOf(response).split('=')[1].split('.')[0], 'base64url').toString());
}

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const authUser = (overrides = {}) => ({ user: { id: 'supabase-user-id', email: 'canonical@example.test', user_metadata: { full_name: 'Canonical Name' }, ...overrides } });

async function harness(t) {
    const saved = Object.fromEntries(Object.keys(fixtures).map((key) => [key, process.env[key]]));
    Object.assign(process.env, fixtures);
    const originalFetch = globalThis.fetch;
    const calls = [];
    let handler = () => { throw new Error('Unexpected upstream request'); };
    globalThis.fetch = async (input, options = {}) => {
        const url = new URL(input);
        assert.equal(url.origin, upstream, 'only fixture Supabase requests are allowed');
        calls.push({ url, ...options });
        return handler(url, options);
    };
    let server;
    t.after(async () => {
        if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        globalThis.fetch = originalFetch;
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    });
    const { createApp } = await import('./server.js');
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const send = (method, path, body, cookie, headers = {}) => new Promise((resolve, reject) => {
        const data = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
        const req = request({ hostname: '127.0.0.1', port: server.address().port, method, path, headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, (res) => {
            let text = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { text += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) }));
        });
        req.on('error', reject);
        req.end(data);
    });
    return { send, calls, mock(fn) { handler = fn; }, login(identity, suppliedPassword = password) { return send('POST', '/api/login', { identity, password: suppliedPassword, next: '/index.html' }); } };
}

function assertLogin(response) {
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.location).pathname, '/index.html');
    assert.match(response.headers['set-cookie'][0], /HttpOnly/);
    assert.match(response.headers['set-cookie'][0], /SameSite=Lax/);
}

function assertRejected(response) {
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.location).pathname, '/login.html');
    assert.equal(new URL(response.headers.location).searchParams.get('error'), 'invalid');
    assert.equal(response.headers['set-cookie'], undefined);
}

for (const [label, users, identity, canonical, name] of [
    ['array', [{ username: 'Reader', password, name: 'Array Reader' }], '  rEaDeR  ', 'Reader', 'Array Reader'],
    ['object string', { Reader: password }, 'reader', 'Reader', 'Reader'],
    ['object details', { Reader: { password, name: 'Object Reader' } }, 'reader', 'Reader', 'Object Reader'],
    ['user alias', [{ user: 'Alias', password, name: 'Alias Reader' }], 'alias', 'Alias', 'Alias Reader'],
]) {
    test(`manual ${label} login preserves canonical identity`, async (t) => {
        const h = await harness(t);
        process.env.MANUAL_USERS = JSON.stringify(users);
        const login = await h.login(identity);
        assertLogin(login);
        assert.equal(h.calls.length, 0);
        const session = await h.send('GET', '/api/session', undefined, cookieOf(login));
        assert.equal(session.status, 200);
        assert.deepEqual(session.json(), { authenticated: true, email: canonical, name, role: 'user', isAdmin: false });
        assert.equal(payloadOf(login).sub, canonical);
        assert.equal(payloadOf(login).provider, 'manual');
        assert.equal(payloadOf(session).sub, canonical);
        assert.equal(payloadOf(session).provider, 'manual');
    });
}

for (const metadata of [{ full_name: 'Full Name', name: 'Fallback' }, { name: 'Fallback' }, {}]) {
    test(`Supabase REST user supplies canonical identity and metadata name ${JSON.stringify(metadata)}`, async (t) => {
        const h = await harness(t);
        h.mock((url, options) => {
            assert.equal(url.pathname, '/auth/v1/token');
            assert.equal(url.searchParams.get('grant_type'), 'password');
            assert.equal(options.method, 'POST');
            assert.equal(options.headers.apikey, 'fixture-anon');
            assert.deepEqual(JSON.parse(options.body), { email: 'Submitted@example.test', password });
            return json(authUser({ user_metadata: metadata }));
        });
        const login = await h.login('Submitted@example.test');
        assertLogin(login);
        const session = await h.send('GET', '/api/session', undefined, cookieOf(login));
        assert.deepEqual(session.json(), { authenticated: true, email: 'canonical@example.test', name: metadata.full_name || metadata.name || '', role: 'user', isAdmin: false });
        for (const response of [login, session]) {
            assert.equal(payloadOf(response).sub, 'supabase-user-id');
            assert.equal(payloadOf(response).provider, 'supabase');
        }
    });
}

for (const source of ['manual', 'supabase']) {
    test(`${source} invalid password does not issue a session`, async (t) => {
        const h = await harness(t);
        if (source === 'manual') {
            process.env.MANUAL_USERS = JSON.stringify({ Reader: password });
            process.env.SUPABASE_ANON_KEY = '';
        }
        h.mock(() => json({ error: 'invalid_grant' }, 400));
        assertRejected(await h.login(source === 'manual' ? 'Reader' : 'reader@example.test', 'wrong-password'));
        assert.equal(h.calls.length, source === 'manual' ? 0 : 1);
    });
}

for (const [label, response] of [
    ['null', null], ['empty', {}], ['missing user', { access_token: 'fixture' }], ['null user', { user: null }],
    ['missing id', { user: { email: 'reader@example.test' } }], ['missing email', { user: { id: 'id' } }],
    ['numeric id', { user: { id: 123, email: 'reader@example.test' } }], ['object email', { user: { id: 'id', email: {} } }],
    ['empty id', { user: { id: '', email: 'reader@example.test' } }], ['empty email', { user: { id: 'id', email: '' } }],
    ['array user', { user: [] }], ['invalid JSON', undefined], ['network failure', undefined],
]) {
    test(`Supabase rejects ${label}`, async (t) => {
        const h = await harness(t);
        h.mock(() => {
            if (label === 'network failure') throw new TypeError('fixture connection failure');
            if (label === 'invalid JSON') return new Response('not JSON', { status: 200 });
            return json(response);
        });
        assertRejected(await h.login('reader@example.test'));
        assert.equal(h.calls.length, 1);
    });
}

for (const source of ['metadata', 'envelope', 'submitted allowlist']) {
    test(`Supabase ${source} cannot grant admin`, async (t) => {
        const h = await harness(t);
        process.env.CMS_ADMIN_EMAILS = 'admin@example.test';
        h.mock(() => json({ ...authUser({ role: 'admin', user_metadata: { role: 'admin', isAdmin: true, email: 'admin@example.test' }, app_metadata: { role: 'admin' } }), ...(source === 'envelope' ? { role: 'admin', email: 'admin@example.test', name: 'Forged' } : {}) }));
        const login = await h.login(source === 'submitted allowlist' ? 'admin@example.test' : 'reader@example.test');
        assertLogin(login);
        const cookie = cookieOf(login);
        const session = await h.send('GET', '/api/session', undefined, cookie);
        assert.equal(session.json().role, 'user');
        assert.equal(session.json().isAdmin, false);
        assert.equal((await h.send('GET', '/api/cms/admin/content', undefined, cookie)).status, 403);
    });
}

for (const legacy of [false, true]) {
    test(`${legacy ? 'legacy' : 'provider'} session refresh preserves identity and absolute expiry`, async (t) => {
        const h = await harness(t);
        const now = Date.now();
        const payload = { ...(legacy ? { u: 'legacy@example.test' } : { e: 'reader@example.test', sub: 'stable-id', provider: 'supabase' }), n: 'Reader', r: 'user', a: now - 60000, exp: now + sessionMs - 60000 };
        const response = await h.send('GET', '/api/session', undefined, signedCookie(payload));
        assert.equal(response.status, 200);
        assert.deepEqual(response.json(), { authenticated: true, email: payload.e || payload.u, name: 'Reader', role: 'user', isAdmin: false });
        assert.equal(response.headers['cache-control'], 'private, no-store');
        const refreshed = payloadOf(response);
        assert.equal(refreshed.exp, payload.exp);
        assert.ok(refreshed.a >= now);
        assert.equal(refreshed.e, payload.e || payload.u);
        if (!legacy) {
            assert.equal(refreshed.sub, payload.sub);
            assert.equal(refreshed.provider, payload.provider);
        }
        assert.equal((await h.send('GET', '/api/session', undefined, cookieOf(response))).status, 200);
    });
}

const routes = [
    ['GET', '/content'], ['GET', '/navigation'], ['GET', '/page/fixture'],
    ['GET', '/admin/content'], ['GET', '/admin/navigation'],
    ['POST', '/admin/content', { slug: 'fixture', title: 'Fixture', content: '<p>Safe</p>', published: true }],
    ['DELETE', '/admin/content?slug=fixture'],
    ['POST', '/admin/navigation', { type: 'module', scope: 'stage', title: 'Fixture' }],
    ['POST', '/admin/navigation/move', { id: 'nav-id', direction: 1 }],
    ['POST', '/admin/navigation/import', { items: [{ key: 'fixture', scope: 'stage', title: 'Imported' }] }],
    ['DELETE', '/admin/navigation?id=nav-id'],
    ['POST', '/admin/upload', '--fixture\r\nContent-Disposition: form-data; name="file"; filename="fixture.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 fixture\r\n--fixture--\r\n'],
];

function mockCms(h) {
    const state = { navigation: [{ id: 'nav-id', title: 'Fixture', scope: 'stage', page: 'fixture', url: '/docs/fixture', published: true }], materials: [{ slug: 'fixture', title: 'Fixture', content: '<p>Safe</p>', published: true }] };
    h.mock((url, options) => {
        assert.equal(options.headers.apikey, 'fixture-service');
        assert.equal(options.headers.Authorization, 'Bearer fixture-service');
        const body = options.body && !Buffer.isBuffer(options.body) ? JSON.parse(options.body) : undefined;
        if (url.pathname === '/rest/v1/cms_navigation') {
            if (options.method === 'POST') { state.navigation.push(...body); return json(body); }
            return json(state.navigation);
        }
        if (url.pathname === '/rest/v1/cms_materials') {
            if (options.method === 'POST') { state.materials = [body]; return json([body]); }
            if (options.method === 'DELETE') { state.materials = []; return json(null); }
            return json(state.materials);
        }
        if (url.pathname === '/rest/v1/rpc/cms_navigation_save') {
            const item = { id: body.p_item.id || 'created-id', ...body.p_item };
            state.navigation = state.navigation.filter((entry) => entry.id !== item.id).concat(item);
            return json(item);
        }
        if (url.pathname === '/rest/v1/rpc/cms_navigation_move') return json({ moved: true });
        if (url.pathname === '/rest/v1/rpc/cms_navigation_remove') {
            state.navigation = state.navigation.filter((entry) => entry.id !== body.p_id);
            return json({ deleted: true });
        }
        if (url.pathname.startsWith('/storage/v1/object/fixture-bucket/')) return json({ Key: 'fixture.pdf' });
        assert.fail(`Unexpected CMS request ${options.method} ${url.pathname}`);
    });
    return state;
}

for (const actor of ['anonymous', 'invalid', 'expired', 'idle', 'reader', 'manual admin', 'allowlist admin']) {
    test(`all CMS routes authorization: ${actor}`, async (t) => {
        const h = await harness(t);
        let cookie;
        const now = Date.now();
        if (actor === 'invalid') cookie = 'kb_session=invalid.signature';
        if (actor === 'expired') cookie = signedCookie({ e: 'reader', a: now, exp: now - 1 });
        if (actor === 'idle') cookie = signedCookie({ e: 'reader', a: now - 8 * 60000, exp: now + sessionMs });
        if (actor === 'reader' || actor === 'manual admin') {
            process.env.MANUAL_USERS = JSON.stringify({ Reader: { password, role: actor === 'manual admin' ? 'admin' : 'user', name: 'Editor' } });
            cookie = cookieOf(await h.login('reader'));
        }
        if (actor === 'allowlist admin') {
            process.env.CMS_ADMIN_EMAILS = ' other@example.test, CANONICAL@EXAMPLE.TEST ';
            h.mock(() => json(authUser()));
            cookie = cookieOf(await h.login('submitted@example.test'));
        }
        mockCms(h);
        for (const [method, path, body] of routes) {
            await t.test(`${method} ${path}`, async () => {
                const before = h.calls.length;
                const authenticated = ['reader', 'manual admin', 'allowlist admin'].includes(actor);
                const expected = !authenticated ? 401 : actor === 'reader' && path.startsWith('/admin/') ? 403 : 200;
                const response = await h.send(method, `/api/cms${path}`, body, cookie, path === '/admin/upload' ? { 'Content-Type': 'multipart/form-data; boundary=fixture' } : {});
                assert.equal(response.status, expected, response.text);
                if (expected !== 200) {
                    assert.deepEqual(response.json(), { error: expected === 401 ? 'Unauthorized' : 'Forbidden' });
                    assert.equal(h.calls.length, before, 'denied routes must not reach upstream');
                } else {
                    assert.ok(h.calls.length > before);
                    if (method === 'GET' && ['/content', '/navigation', '/admin/content', '/admin/navigation'].includes(path)) {
                        assert.equal(h.calls.at(-1).url.searchParams.get('published'), path.startsWith('/admin/') ? null : 'eq.true');
                    }
                }
            });
        }
    });
}

test('manual admin navigation CRUD and CMS material access use real controllers', async (t) => {
    const h = await harness(t);
    process.env.MANUAL_USERS = JSON.stringify({ Editor: { password, role: 'admin', name: 'Fixture Editor' } });
    const cookie = cookieOf(await h.login('editor'));
    const session = await h.send('GET', '/api/session', undefined, cookie);
    assert.deepEqual(session.json(), { authenticated: true, email: 'Editor', name: 'Fixture Editor', role: 'admin', isAdmin: true });
    mockCms(h);
    const saved = await h.send('POST', '/api/cms/admin/navigation', { type: 'module', scope: 'stage', title: ' Created ' }, cookie);
    assert.equal(saved.status, 200);
    const item = saved.json().item;
    assert.equal(item.title, 'Created');
    assert.equal(JSON.parse(h.calls.at(-1).body).p_editor, 'Fixture Editor');
    const updated = await h.send('POST', '/api/cms/admin/navigation', { ...item, title: 'Updated' }, cookie);
    assert.equal(updated.status, 200);
    assert.equal(updated.json().item.id, item.id);
    const listed = await h.send('GET', '/api/cms/admin/navigation', undefined, cookie);
    assert.ok(listed.json().items.some((entry) => entry.id === item.id && entry.title === 'Updated'));
    assert.equal((await h.send('POST', '/api/cms/admin/navigation/move', { id: item.id, direction: -1 }, cookie)).status, 200);
    assert.equal((await h.send('DELETE', `/api/cms/admin/navigation?id=${item.id}`, undefined, cookie)).status, 200);
    assert.ok(!(await h.send('GET', '/api/cms/admin/navigation', undefined, cookie)).json().items.some((entry) => entry.id === item.id));
    const material = await h.send('POST', '/api/cms/admin/content', { slug: 'fixture', title: 'Updated material', content: '<script>bad()</script><p>Safe</p>', published: true }, cookie);
    assert.equal(material.status, 200);
    assert.equal(material.json().content, '<p>Safe</p>');
    assert.equal(material.json().last_edited_by, 'Fixture Editor');
    const content = await h.send('GET', '/api/cms/content?slug=fixture', undefined, cookie);
    assert.equal(content.json().title, 'Updated material');
    assert.equal((await h.send('GET', '/docs/fixture', undefined, cookie)).status, 200);
    assert.deepEqual((await h.send('DELETE', '/api/cms/admin/content?slug=fixture', undefined, cookie)).json(), { deleted: true });
});
