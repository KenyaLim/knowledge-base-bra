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
            } else if (url.pathname.endsWith('/cms_faq_tags')) {
                const body = JSON.parse(options.body);
                data = (await db.query('SELECT * FROM cms_faq_tags($1,$2)', [body.p_search, body.p_admin])).rows;
            } else if (url.pathname.endsWith('/cms_faqs')) {
                const q = url.searchParams;
                const where = [];
                const values = [];
                for (const field of ['published', 'category', 'featured', 'id']) {
                    if (q.has(field)) { values.push(q.get(field).slice(3)); where.push(`${field}=$${values.length}`); }
                }
                if (q.has('tags')) { values.push(JSON.parse(q.get('tags').slice(3).replace(/^\{/, '[').replace(/\}$/, ']'))); where.push(`tags @> $${values.length}::text[]`); }
                if (q.has('question')) { assert.ok(q.get('question').startsWith('imatch.')); values.push(q.get('question').slice(7)); where.push(`question ~* $${values.length}`); }
                values.push(Number(q.get('limit') || 20), Number(q.get('offset') || 0));
                data = (await db.query(`SELECT * FROM cms_faqs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY sort_order, created_at, id LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
                if (q.get('select') !== '*') data = data.map((row) => Object.fromEntries(q.get('select').split(',').map((key) => [key, row[key]])));
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
    await t.test('filtered bounded previews, tags, detail security and old payload preservation', async () => {
        const tagged = await (await send(api, 'POST', { ...payload, question: 'Tagged featured', tags: ['orders', 'orders', 'quoted,"tag'], featured: true, published: true })).json();
        assert.deepEqual(tagged.tags, ['orders', 'quoted,"tag']);
        await send(`${api}/${tagged.id}`, 'PUT', { ...edited, question: 'Tagged featured' });
        assert.equal((await db.query('SELECT featured FROM cms_faqs WHERE id=$1', [tagged.id])).rows[0].featured, true);
        const query = '/api/faq?featured=true&category=PROMAN&tag=orders&search=Tagged&limit=5';
        const previews = await (await send(query)).json();
        assert.equal(previews.length, 1);
        assert.equal(previews[0].id, tagged.id);
        assert.equal('answer' in previews[0], false);
        assert.equal((await (await send(query + '&offset=1')).json()).length, 0);
        assert.equal((await (await send('/api/faq?limit=1&page=2')).json()).length, 1);
        assert.equal((await (await send('/api/faq/tags?search=ord')).json())[0], 'orders');
        assert.equal((await (await send('/api/faq?tag=' + encodeURIComponent('quoted,"tag'))).json()).length, 1);
        for (const invalid of ['limit=51', 'limit=0', 'offset=-1', 'page=0', 'featured=yes', 'category=bad', 'search[x]=bad']) assert.equal((await send('/api/faq?' + invalid)).status, 400);
        for (const invalid of [{ tags: 'bad' }, { tags: [''] }, { tags: ['x'.repeat(41)] }, { featured: 'true' }]) assert.equal((await send(api, 'POST', { ...payload, ...invalid })).status, 400);
        for (const literal of ['*', '%', '_', '\\', '.*', '(x)|', '&published=eq.false', '",or=(published.eq.false)']) {
            const question = `Literal ${literal} match`;
            await send(`${api}/${tagged.id}`, 'PUT', { ...edited, question });
            const matches = await (await send('/api/faq?search=' + encodeURIComponent(literal))).json();
            assert.deepEqual(matches.map((row) => row.id), [tagged.id]);
        }
        assert.equal((await send('/api/faq/' + tagged.id)).status, 200);
        await send(`${api}/${tagged.id}`, 'PUT', { ...edited, published: false });
        assert.equal((await send('/api/faq/' + tagged.id)).status, 404);
        assert.equal((await send(`${api}/${tagged.id}`)).status, 200);
        assert.equal((await (await send('/api/faq/tags')).json()).includes('orders'), false);
        assert.equal((await (await send(api + '/tags')).json()).includes('orders'), true);
        await send('/api/login', 'POST', { identity: 'reader', password: 'reader-password' });
        assert.equal((await send(`${api}/${tagged.id}`)).status, 403);
        assert.equal((await send('/api/faq/' + tagged.id)).status, 404);
        cookie = '';
        assert.equal((await send('/api/faq/' + tagged.id)).status, 401);
        await send('/api/login', 'POST', { identity: 'owner', password: 'original-password' });
    });
    await t.test('dashboard fills published legacy rows, prefers featured and filters before limiting', async () => {
        await db.exec('UPDATE cms_faqs SET featured=false');
        const dom = new JSDOM(await readFile(new URL('./index.html', import.meta.url), 'utf8'), { url: origin, runScripts: 'outside-only' });
        const calls = [];
        dom.window.fetch = async (url) => { calls.push(url); return send(url); };
        dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
        const settle = async () => {
            for (let i = 0; i < 100 && dom.window.document.getElementById('faq-status').textContent === 'Memuat FAQ...'; i++) await new Promise((resolve) => setTimeout(resolve, 20));
        };
        await settle();
        assert.equal(dom.window.document.querySelectorAll('.faq-item').length, 4);
        assert.equal(calls.length, 2);
        for (let i = 0; i < 7; i++) await send(api, 'POST', { ...payload, question: 'Dashboard ' + i, published: true, featured: i === 6 });
        dom.window.document.querySelector('[data-category="PROMAN"]').click();
        await settle();
        const questions = [...dom.window.document.querySelectorAll('.faq-question')].map((node) => node.textContent);
        assert.deepEqual(questions, ['Dashboard 6', 'Dashboard 0', 'Dashboard 1', 'Dashboard 2', 'Dashboard 3']);
        assert.match(calls.at(-1), /limit=4/);
        assert.match(calls.at(-1), /category=PROMAN/);
        assert.match(calls.at(-1), /featured=false/);
        dom.window.close();
    });
    await t.test('missing columns and outdated RPC never report success', async () => {
        const savedFetch = globalThis.fetch;
        globalThis.fetch = async (input, options) => new URL(input).hostname === 'database.invalid' && new URL(input).pathname.endsWith('/cms_mutate_faq') ? Response.json({ id: 'old', ...payload }) : savedFetch(input, options);
        const stale = await send(api, 'POST', { ...payload, tags: ['new'], featured: true });
        assert.equal(stale.status, 503);
        assert.match((await stale.json()).error, /sql\/faq.sql/);
        globalThis.fetch = savedFetch;
        await db.exec('ALTER TABLE cms_faqs DROP COLUMN featured');
        const missing = await send('/api/faq?featured=true&limit=5');
        assert.equal(missing.status, 503);
        assert.match((await missing.json()).error, /sql\/faq.sql/);
    });
    globalThis.fetch = async (input, options) => new URL(input).hostname === 'database.invalid' ? Response.json({}, { status: 503 }) : realFetch(input, options);
    assert.equal((await send('/api/faq')).status, 503);
});

test('FAQ additive migration preserves preexisting rows and old RPC fields', async () => {
    const db = new PGlite();
    try {
        await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
        await db.exec(migration.slice(0, migration.indexOf('ALTER TABLE')));
        await db.exec("INSERT INTO cms_faqs(question,answer,category) VALUES ('Legacy','<p>Legacy answer</p>','Umum')");
        await db.exec(migration);
        await db.exec(migration);
        const row = (await db.query("SELECT * FROM cms_faqs WHERE question='Legacy'")).rows[0];
        assert.deepEqual(row.tags, []);
        assert.equal(row.featured, false);
        assert.equal(row.answer, '<p>Legacy answer</p>');
        assert.equal((await db.query("SELECT indexname FROM pg_indexes WHERE tablename='cms_faqs'")).rows.length, 3);
    } finally { await db.close(); }
});

async function browser(admin, handler) {
    const html = await readFile(new URL(admin ? './faq-admin.html' : './getting-started/faq.html', import.meta.url), 'utf8');
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.fetch = handler;
    dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    return dom;
}
test('dashboard placement, server category filtering, maximum five and lazy cached accordion', async () => {
    const dom = new JSDOM(await readFile(new URL('./index.html', import.meta.url), 'utf8'), { url: 'http://localhost/', runScripts: 'outside-only' });
    const calls = [];
    dom.window.fetch = async (url) => {
        calls.push(url);
        if (!url.includes('?')) return Response.json({ answer: '<p>Detail</p><img src="https://example.com/a.webp">' });
        const query = new URL(url, 'http://localhost').searchParams;
        assert.equal(query.get('limit'), '5');
        assert.equal(query.get('featured'), 'true');
        return Response.json(Array.from({ length: 5 }, (_, i) => ({ id: String(i), question: 'Question ' + i, category: query.get('category') === 'Semua' ? 'Umum' : query.get('category'), tags: ['orders'] })));
    };
    dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
    const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
    await settle();
    const document = dom.window.document;
    assert.equal(document.querySelector('.search-box').nextElementSibling.id, 'searchStatus');
    assert.equal(document.getElementById('searchStatus').nextElementSibling.id, 'searchResults');
    assert.equal(document.getElementById('faq-app').parentElement.classList.contains('hero'), false);
    assert.equal(document.querySelector('#faq-app #searchInput, #faq-app #searchResults'), null);
    assert.equal(document.querySelectorAll('.faq-item').length, 5);
    assert.equal(calls.length, 1);
    const toggle = document.querySelector('.faq-question');
    toggle.click(); await settle(); toggle.click(); toggle.click(); await settle();
    assert.equal(calls.length, 2);
    assert.equal(document.querySelector('.faq-answer img').loading, 'lazy');
    assert.equal(document.querySelector('.faq-tags').textContent, 'orders');
    document.querySelector('[data-category="STAGE"]').click(); await settle();
    assert.match(calls.at(-1), /category=STAGE/);
    assert.equal(document.querySelector('.faq-all').getAttribute('href'), 'getting-started/faq.html');
    dom.window.close();
});

test('dashboard documentation search and FAQ filters operate independently', async () => {
    const dom = new JSDOM(await readFile(new URL('./index.html', import.meta.url), 'utf8'), { url: 'http://localhost/', runScripts: 'outside-only' });
    try {
        const calls = [];
        dom.window.fetch = async (url) => {
            calls.push(url);
            if (url.startsWith('/api/faq?')) {
                const category = new URL(url, 'http://localhost').searchParams.get('category');
                return Response.json(Array.from({ length: 5 }, (_, i) => ({ id: String(i), question: 'FAQ ' + i, category: category === 'Semua' ? 'Umum' : category, tags: [] })));
            }
            if (url.startsWith('/api/cms/content?')) return Response.json([{ slug: 'unique-guide', title: 'Uniqueguide', content: '<p>Documentation</p>', module: 'STAGE', summary: 'Guide' }]);
            if (url === '/api/cms/navigation') return Response.json({ items: [] });
            if (url === '/api/session') return Response.json({});
            return new Response('<main><h1>Other documentation</h1></main>');
        };
        await new Promise((resolve) => dom.window.document.readyState === 'loading' ? dom.window.document.addEventListener('DOMContentLoaded', resolve, { once: true }) : resolve());
        dom.window.eval(await readFile(new URL('./js/navbar.js', import.meta.url), 'utf8'));
        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
        dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
        const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
        await settle();
        const { document, Event, KeyboardEvent } = dom.window;
        const input = document.getElementById('searchInput');
        const results = document.getElementById('searchResults');
        const faq = document.getElementById('faq-app');
        const initialFAQ = faq.innerHTML;
        const faqCalls = calls.filter((url) => url.startsWith('/api/faq')).length;
        input.value = 'Uniqueguide';
        input.dispatchEvent(new Event('input'));
        assert.equal(results.children.length, 1);
        assert.match(results.textContent, /Uniqueguide/);
        assert.ok(results.compareDocumentPosition(faq) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
        assert.equal(faq.innerHTML, initialFAQ);
        assert.equal(calls.filter((url) => url.startsWith('/api/faq')).length, faqCalls);
        const searchHTML = results.innerHTML;
        const searchStatus = document.getElementById('searchStatus').textContent;
        document.querySelector('[data-category="STAGE"]').click();
        await settle();
        assert.match(calls.at(-1), /category=STAGE/);
        assert.equal(document.querySelector('[data-category="STAGE"]').getAttribute('aria-pressed'), 'true');
        assert.equal(results.innerHTML, searchHTML);
        assert.equal(document.getElementById('searchStatus').textContent, searchStatus);
        assert.equal(input.value, 'Uniqueguide');
        input.value = 'no-matching-document';
        document.getElementById('searchButton').click();
        assert.equal(results.children.length, 0);
        assert.match(document.getElementById('searchStatus').textContent, /No results found/);
        input.value = 'Uniqueguide';
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        assert.equal(results.children.length, 1);
        input.value = '';
        input.dispatchEvent(new Event('input'));
        assert.equal(results.children.length, 0);
        assert.equal(document.querySelectorAll('.faq-item').length, 5);
        assert.equal(document.querySelector('[data-category="STAGE"]').getAttribute('aria-pressed'), 'true');
    } finally { dom.window.close(); }
});

test('full FAQ loads additional previews and admin edit loads detail with tags and featured', async () => {
    const calls = [];
    const handler = async (url, options) => {
        calls.push({ url, ...options });
        if (!url.includes('?')) return Response.json({ id: 'one', question: 'Question', answer: '<p>Saved</p>', category: 'Umum', tags: ['reuse', 'quoted,"tag'], featured: true });
        const offset = Number(new URL(url, 'http://localhost').searchParams.get('offset'));
        return Response.json(Array.from({ length: offset ? 1 : 20 }, (_, i) => ({ id: i ? String(i + offset) : 'one', question: 'Question', category: 'Umum', tags: ['reuse'], featured: true })));
    };
    const dom = await browser(false, handler);
    dom.window.document.getElementById('faq-more').click();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelectorAll('.faq-item').length, 21);
    assert.equal(dom.window.document.getElementById('faq-more').hidden, true);
    assert.match(calls.at(-1).url, /offset=20/);
    dom.window.close();
    const admin = await browser(true, handler);
    [...admin.window.document.querySelectorAll('.faq-actions button')].find((node) => node.textContent === 'Edit').click();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(admin.window.document.getElementById('faq-tags').value, 'reuse, quoted,"tag');
    assert.equal(admin.window.document.getElementById('faq-featured').checked, true);
    assert.equal(admin.window.document.getElementById('faq-answer').innerHTML, '<p>Saved</p>');
    admin.window.document.getElementById('faq-form').dispatchEvent(new admin.window.Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.deepEqual(JSON.parse(calls.find((call) => call.method === 'PUT').body).tags, ['reuse', 'quoted,"tag']);
    admin.window.close();
});

test('FAQ styles stay scoped and override legacy accordion presentation', async () => {
    const css = await readFile(new URL('./css/faq.css', import.meta.url), 'utf8');
    const dom = new JSDOM('<style>' + css + '</style><button class="faq-question">Outside</button><section id="faq-app"><article class="faq-item open"><h2><button class="faq-question">Inside<i></i></button></h2><div class="faq-answer" hidden>Hidden</div></article></section>');
    function scoped(rules) {
        for (const rule of rules) {
            if (rule.selectorText) for (const selector of rule.selectorText.split(',')) assert.ok(selector.trim().startsWith('#faq-app'), selector);
            if (rule.cssRules) scoped(rule.cssRules);
        }
    }
    scoped(dom.window.document.styleSheets[0].cssRules);
    assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('.faq-answer')).display, 'none');
    assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('#faq-app .faq-question i')).transform, 'rotate(225deg)');
    assert.match(css, /@media \(max-width: 600px\)/);
    assert.match(css, /#faq-app #faq-categories \{ flex-direction: row/);
    dom.window.close();
});

test('dashboard fallback errors show retry instead of partial success', async () => {
    const dom = new JSDOM(await readFile(new URL('./index.html', import.meta.url), 'utf8'), { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.fetch = async (url) => url.includes('featured=true') ? Response.json([{ id: 'one', question: 'Featured', category: 'Umum' }]) : Response.json({ error: 'Skema FAQ: sql/faq.sql' }, { status: 503 });
    dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelectorAll('.faq-item').length, 0);
    assert.equal(dom.window.document.getElementById('faq-retry').hidden, false);
    assert.match(dom.window.document.getElementById('faq-status').textContent, /sql\/faq.sql/);
    dom.window.close();
});

test('dashboard category clicks clear old cards immediately and reject stale featured and fallback responses', async () => {
    const dom = new JSDOM(await readFile(new URL('./index.html', import.meta.url), 'utf8'), { url: 'http://localhost/', runScripts: 'outside-only' });
    const pending = [];
    dom.window.fetch = (url) => new Promise((resolve) => pending.push({ query: new URL(url, 'http://localhost').searchParams, resolve }));
    dom.window.eval(await readFile(new URL('./js/faq.js', import.meta.url), 'utf8'));
    const document = dom.window.document;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
    const respond = (call, category, count = 5) => call.resolve(Response.json(Array.from({ length: count }, (_, i) => ({ id: category + i, question: category + i, category, published: true, answer: '<p>Answer</p>' }))));
    respond(pending.shift(), 'Umum'); await settle();
    for (const category of ['STAGE', 'PROMAN', 'Umum', 'Semua']) {
        document.querySelector(`[data-category="${category}"]`).click();
        assert.equal(document.querySelectorAll('.faq-item').length, 0);
        assert.equal(document.querySelector('[aria-pressed="true"]').dataset.category, category);
        const call = pending.shift();
        assert.equal(call.query.get('category'), category);
        assert.equal(call.query.get('limit'), '5');
        assert.equal(call.query.get('featured'), 'true');
        respond(call, category === 'Semua' ? 'Umum' : category); await settle();
        assert.equal(document.querySelectorAll('.faq-item').length, 5);
        assert.ok([...document.querySelectorAll('.faq-item')].every((node) => category === 'Semua' || node.dataset.faqCategory === category));
        const toggle = document.querySelector('.faq-question');
        toggle.click(); await settle();
        assert.equal(toggle.getAttribute('aria-expanded'), 'true');
        toggle.click();
        assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    }
    document.querySelector('[data-category="STAGE"]').click();
    const staleFeatured = pending.shift();
    document.querySelector('[data-category="PROMAN"]').click();
    respond(pending.shift(), 'PROMAN', 1); await settle();
    const staleFallback = pending.shift();
    assert.equal(staleFallback.query.get('category'), 'PROMAN');
    assert.equal(staleFallback.query.get('limit'), '4');
    assert.equal(staleFallback.query.get('featured'), 'false');
    document.querySelector('[data-category="Umum"]').click();
    respond(pending.shift(), 'Umum'); await settle();
    respond(staleFeatured, 'STAGE'); respond(staleFallback, 'PROMAN', 4); await settle();
    assert.equal(document.querySelectorAll('.faq-item').length, 5);
    assert.ok([...document.querySelectorAll('.faq-item')].every((node) => node.dataset.faqCategory === 'Umum'));
    dom.window.close();
});

test('full FAQ pills combine search and tags with accurate loaded counts and reset pagination', async () => {
    const calls = [];
    const dom = await browser(false, async (url) => {
        const query = new URL(url, 'http://localhost').searchParams;
        calls.push(query);
        if (url.includes('/tags?')) return Response.json(['orders']);
        return Response.json([{ id: 'one', question: 'Order help', category: query.get('category') === 'Semua' ? 'Umum' : query.get('category'), tags: ['orders'], published: true }]);
    });
    const { document, Event } = dom.window;
    for (const category of ['STAGE', 'PROMAN', 'Umum', 'Semua']) {
        document.querySelector(`[data-category="${category}"]`).click();
        await new Promise((resolve) => setTimeout(resolve, 10));
        assert.equal(calls.at(-1).get('category'), category);
        assert.equal(calls.at(-1).get('offset'), '0');
        assert.equal(document.getElementById('faq-status').textContent, '1 pertanyaan cocok dimuat');
    }
    document.getElementById('faq-search').value = 'Order';
    document.getElementById('faq-search').dispatchEvent(new Event('input'));
    document.getElementById('faq-tag').value = 'orders';
    document.getElementById('faq-tag').dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.ok(calls.some((query) => query.get('search') === 'Order' && query.get('tag') === 'orders' && query.get('offset') === '0'));
    assert.equal(document.querySelectorAll('.faq-item').length, 1);
    assert.equal(document.getElementById('faq-more').hidden, true);
    dom.window.close();
});

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
    document.querySelector('[data-category="PROMAN"]').click();
    await new Promise((resolve) => setTimeout(resolve, 20));
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
    assert.equal(down.disabled, false);
    down.click(); await settle();
    assert.ok(calls.some((call) => call.method === 'PATCH' && JSON.parse(call.body).direction === 'down'));
    dom.window.confirm = () => false; action('Hapus').click(); await settle();
    assert.equal(calls.some((call) => call.method === 'DELETE'), false);
    dom.window.confirm = () => true; action('Hapus').click(); await settle();
    assert.ok(calls.some((call) => call.method === 'DELETE'));
    dom.window.close();
});
