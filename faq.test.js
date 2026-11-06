import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { JSDOM } from 'jsdom';

const migration = await readFile(new URL('./sql/faq.sql', import.meta.url), 'utf8');
test('FAQ SQL and HTTP lifecycle, authorization, CSRF, validation and sanitization', async (t) => {
    process.env.VERCEL = '1';
    process.env.AUTH_SECRET = 'faq-integration-secret';
    process.env.MANUAL_USERS = JSON.stringify({ owner: { password: 'original-password', role: 'admin' }, reader: { password: 'reader-password', role: 'user' } });
    process.env.SUPABASE_URL = 'https://database.invalid';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
    const db = new PGlite();
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
    await db.exec(migration);
    await db.exec(migration);
    assert.equal((await db.query('SELECT * FROM cms_faqs')).rows.length, 4);
    await db.exec('SET ROLE anon');
    await assert.rejects(db.query('SELECT * FROM cms_faqs'), /permission denied/);
    await assert.rejects(db.query("SELECT cms_mutate_faq('delete', null, '{}')"), /permission denied/);
    await db.exec('RESET ROLE');
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (input, options = {}) => {
        const url = new URL(input);
        if (url.hostname !== 'database.invalid') return realFetch(input, options);
        try {
            let data = [];
            if (url.pathname.endsWith('/kb_action_limit')) {
                data = true;
            } else if (url.pathname.endsWith('/cms_mutate_faq')) {
                const body = JSON.parse(options.body);
                data = (await db.query('SELECT cms_mutate_faq($1,$2,$3) AS result', [body.p_action, body.p_id, body.p_data])).rows[0].result;
            } else if (url.pathname.endsWith('/cms_faqs')) {
                data = (await db.query(`SELECT * FROM cms_faqs ${url.searchParams.has('published') ? 'WHERE published' : ''} ORDER BY sort_order, created_at, id`)).rows;
            }
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
        const response = await realFetch(origin + path, { method, redirect: 'manual', headers: { Cookie: cookie, ...(csrfOrigin ? { Origin: csrfOrigin } : {}), 'Content-Type': 'application/json' }, ...(body && !['GET', 'HEAD'].includes(method) ? { body: JSON.stringify(body) } : {}) });
        const updated = response.headers.get('set-cookie');
        if (updated) cookie = updated.split(';')[0];
        return response;
    }
    const api = '/api/admin/faq';
    assert.equal((await send('/api/faq')).status, 401);
    assert.equal((await send(api)).status, 401);
    await send('/api/login', 'POST', { identity: 'reader', password: 'reader-password' });
    assert.equal((await send('/api/faq')).status, 200);
    for (const [path, method] of [[api, 'GET'], [api, 'POST'], [api + '/reorder', 'PATCH'], [api + '/bad', 'PUT'], [api + '/bad', 'DELETE']]) assert.equal((await send(path, method, {})).status, 403);
    assert.equal((await send('/faq-admin.html')).status, 302);
    assert.equal((await send('/faq-admin')).status, 302);
    const { default: middleware } = await import('./middleware.js');
    assert.equal((await middleware(new Request(origin + '/faq-admin', { headers: { cookie } }))).status, 302);
    await send('/api/login', 'POST', { identity: 'owner', password: 'original-password' });
    assert.equal((await send('/faq-admin')).status, 200);
    const payload = { question: 'Test FAQ', answer: '<p>Hello <b>bold</b><i>italic</i></p><ul><li>one</li></ul><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="https://example.com/a.png" onerror="alert(1)">', category: 'PROMAN', published: false };
    assert.equal((await send(api, 'POST', payload, 'https://evil.invalid')).status, 403);
    assert.equal((await send(api, 'POST', payload, '')).status, 403);
    const created = await send(api, 'POST', payload);
    assert.equal(created.status, 201);
    const item = await created.json();
    assert.doesNotMatch(item.answer, /script|onerror|javascript:/);
    assert.match(item.answer, /<b>bold<\/b>/);
    assert.equal((await (await send('/api/faq')).json()).some((row) => row.id === item.id), false);
    for (const invalid of [{ question: '' }, { question: 'x'.repeat(301) }, { answer: 'x'.repeat(50001) }, { answer: '<script>x</script>' }, { category: 'other' }, { published: 'true' }]) assert.equal((await send(api, 'POST', { ...payload, ...invalid })).status, 400);
    assert.equal((await send(api + '/invalid', 'PUT', payload)).status, 400);
    assert.equal((await send(api + '/00000000-0000-4000-8000-000000000000', 'DELETE')).status, 404);
    const edited = { ...payload, question: 'Edited FAQ', answer: '<p>Persisted answer</p>', published: true };
    assert.equal((await send(`${api}/${item.id}`, 'PUT', edited)).status, 200);
    assert.equal((await (await send('/api/faq')).json()).find((row) => row.id === item.id).question, 'Edited FAQ');
    assert.equal((await db.query('SELECT answer FROM cms_faqs WHERE id=$1', [item.id])).rows[0].answer, edited.answer);
    assert.equal((await send(api + '/reorder', 'PATCH', { id: item.id, direction: 'up' })).status, 200);
    const ordered = await (await send(api)).json();
    assert.equal(ordered[3].id, item.id);
    assert.equal((await send(api + '/reorder', 'PATCH', { id: item.id, direction: 'drop table cms_faqs' })).status, 400);
    await Promise.all([send(api + '/reorder', 'PATCH', { id: item.id, direction: 'up' }), send(api + '/reorder', 'PATCH', { id: item.id, direction: 'down' })]);
    assert.equal((await db.query('SELECT count(DISTINCT sort_order)::int AS n FROM cms_faqs')).rows[0].n, 5);
    await send(`${api}/${item.id}`, 'PUT', { ...edited, published: false });
    assert.equal((await (await send('/api/faq')).json()).length, 4);
    assert.equal((await send(`${api}/${item.id}`, 'DELETE')).status, 200);
    assert.equal((await (await send(api)).json()).length, 4);
    await db.query("UPDATE cms_faqs SET question='Seed edited' WHERE sort_order=0");
    await db.exec(migration);
    assert.equal((await db.query('SELECT question FROM cms_faqs WHERE sort_order=0')).rows[0].question, 'Seed edited');
    globalThis.fetch = async (input, options) => new URL(input).hostname === 'database.invalid' ? Response.json({}, { status: 503 }) : realFetch(input, options);
    assert.equal((await send('/api/faq')).status, 503);
});

async function browser(admin, handler) {
    const html = await readFile(new URL(admin ? './faq-admin.html' : './getting-started/faq.html', import.meta.url), 'utf8');
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.fetch = handler;
    dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    return dom;
}
const rows = [{ id: 'one', question: 'Stage question', answer: '<p>Answer</p>', category: 'STAGE', published: true }, { id: 'two', question: 'Proman question', answer: '<p>Other</p>', category: 'PROMAN', published: false }];
test('FAQ accessible accordion, search, categories and empty state', async () => {
    const dom = await browser(false, async () => Response.json(rows));
    const { document, Event } = dom.window;
    const toggle = document.querySelector('.faq-question');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(document.getElementById(toggle.getAttribute('aria-controls')).hidden, false);
    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    const search = document.getElementById('faq-search');
    search.value = 'stage'; search.dispatchEvent(new Event('input'));
    assert.equal(document.querySelectorAll('.faq-item').length, 1);
    const category = document.getElementById('faq-category');
    category.value = 'PROMAN'; category.dispatchEvent(new Event('change'));
    assert.equal(document.querySelectorAll('.faq-item').length, 0);
    assert.match(document.getElementById('faq-status').textContent, /Tidak ada/);
    dom.window.close();
});
test('FAQ error retry and admin add/edit/publish/reorder/delete actions', async () => {
    const calls = [];
    let fail = true;
    const dom = await browser(true, async (url, options) => {
        calls.push({ url, ...options });
        if (options.method !== 'GET') return Response.json(rows);
        return fail ? Response.json({ error: 'Unavailable' }, { status: 503 }) : Response.json(rows);
    });
    const { document, Event } = dom.window;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(document.getElementById('faq-retry').hidden, false);
    fail = false; document.getElementById('faq-retry').click(); await settle();
    document.getElementById('faq-add').click();
    document.getElementById('faq-question').value = 'New question';
    document.getElementById('faq-answer').innerHTML = '<p>New answer</p>';
    document.getElementById('faq-form').dispatchEvent(new Event('submit', { cancelable: true })); await settle();
    assert.equal(calls.find((call) => call.method === 'POST').url, '/api/admin/faq');
    function action(label) { return [...document.querySelectorAll('.faq-actions button')].find((button) => button.textContent === label && !button.disabled); }
    action('Edit').click();
    document.getElementById('faq-form').dispatchEvent(new Event('submit', { cancelable: true })); await settle();
    assert.ok(calls.some((call) => call.method === 'PUT' && call.url.endsWith('/one')));
    action('Batalkan terbit').click(); await settle();
    assert.equal(JSON.parse(calls.filter((call) => call.method === 'PUT').at(-1).body).published, false);
    const down = [...document.querySelectorAll('.faq-actions button')].find((button) => button.textContent === 'Turun');
    assert.ok(down);
    down.disabled = false;
    down.click(); await settle();
    assert.ok(calls.some((call) => call.method === 'PATCH' && JSON.parse(call.body).direction === 'down'));
    dom.window.confirm = () => false; action('Hapus').click(); await settle();
    assert.equal(calls.some((call) => call.method === 'DELETE'), false);
    dom.window.confirm = () => true; action('Hapus').click(); await settle();
    assert.ok(calls.some((call) => call.method === 'DELETE'));
    dom.window.close();
});
