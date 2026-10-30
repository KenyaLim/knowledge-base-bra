import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, cp, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import middleware from './middleware.js';
import { execFileSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import { JSDOM } from 'jsdom';
import { sanitizeContent } from './src/utils/content.js';
import { renderDocumentationPage } from './src/templates/documentationPage.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('deployment output contains only website files and keeps function routing separate', async () => {
    const root = fileURLToPath(new URL('.', import.meta.url));
    const entries = await readdir(path.join(root, 'public'), { recursive: true, withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile()).map((entry) => path.relative(path.join(root, 'public'), path.join(entry.parentPath, entry.name))).sort();
    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
    const expected = tracked.filter((file) => /^(?:[^/]+\.html|css\/style\.css|js\/(?:admin|cms|erp-editor|navbar|navigation-admin)\.js|(?:erp|proman|stage|getting-started)\/.*\.html)$/.test(file)).sort();
    assert.deepEqual(files, expected);
    for (const file of files) {
        assert.deepEqual(await readFile(path.join(root, 'public', file)), await readFile(path.join(root, file)));
        assert.doesNotMatch(await readFile(path.join(root, 'public', file), 'utf8'), /process\.env|SUPABASE_SERVICE_ROLE_KEY|AUTH_SECRET|createApp/);
    }
    const config = JSON.parse(await read('vercel.json'));
    assert.equal(config.outputDirectory, 'public');
    assert.equal(config.framework, null);
    assert.deepEqual(config.rewrites, [
        { source: '/docs/:page', destination: '/api/index' },
        { source: '/api/(.*)', destination: '/api/index' },
    ]);
    assert.equal(config.functions['api/index.js'].includeFiles, 'generated/sanitize-html.cjs');
    assert.ok((await read('generated/sanitize-html.cjs')).length > 0);
});

test('build clears stale output and excludes secrets, backend files and symlinks', async () => {
    const root = fileURLToPath(new URL('.', import.meta.url));
    const fixture = await mkdtemp(path.join(tmpdir(), 'kb-public-'));
    try {
        for (const file of ['build.js', 'package.json', 'index.html', 'login.html', 'admin.html', 'materials.html', 'ERP Docs.html', 'css', 'js', 'erp', 'proman', 'stage', 'getting-started']) {
            await cp(path.join(root, file), path.join(fixture, file), { recursive: true });
        }
        await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
        for (const file of ['.env', 'api/index.js', 'src/secret.js', 'sql/private.sql', 'middleware.js', 'js/private.js', 'css/.env', 'erp/secret.sql', 'erp/.private/secret.html', 'public/api/index.js']) {
            await mkdir(path.dirname(path.join(fixture, file)), { recursive: true });
            await writeFile(path.join(fixture, file), 'PRIVATE_BUILD_SENTINEL');
        }
        await symlink(path.join(fixture, '.env'), path.join(fixture, 'erp/leak.html'));
        execFileSync(process.execPath, [path.join(fixture, 'build.js')], { cwd: fixture, timeout: 30000 });
        const entries = await readdir(path.join(fixture, 'public'), { recursive: true, withFileTypes: true });
        for (const entry of entries) {
            assert.equal(entry.isSymbolicLink(), false);
            if (entry.isFile()) assert.doesNotMatch(await readFile(path.join(entry.parentPath, entry.name), 'utf8'), /PRIVATE_BUILD_SENTINEL/);
        }
        assert.ok(entries.some((entry) => entry.name === 'index.html'));
        assert.ok(!entries.some((entry) => entry.name === 'api' || entry.name === 'leak.html'));
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

test('deployment middleware preserves anonymous static gating and API pass-through', async () => {
    for (const route of ['/index.html', '/erp/0-order/order.html', '/docs/example']) {
        const response = await middleware(new Request(`https://example.test${route}`));
        assert.equal(response.status, 302);
        assert.equal(new URL(response.headers.get('location')).pathname, '/login.html');
    }
    for (const route of ['/login.html', '/css/style.css', '/js/navbar.js', '/api/session']) {
        const response = await middleware(new Request(`https://example.test${route}`));
        assert.equal(response.headers.get('x-middleware-next'), '1');
    }
});

test('sanitizer removes executable legacy markup and preserves documentation', () => {
    const html = sanitizeContent('<script>alert(1)</script><img src="javascript:evil()" onerror="evil()"><a href="jav&#97;script:evil()">x</a><h2 class="editor-heading">Heading</h2><table><tr><td>Cell</td></tr></table><ul><li>Item</li></ul><img src="https://example.test/image.png">');
    assert.doesNotMatch(html, /javascript|onerror|<script/);
    assert.match(html, /<table>/);
    assert.match(html, /editor-heading/);
    assert.match(html, /https:\/\/example.test/);
});

test('sanitizer and API load without require(ESM) support', () => {
    execFileSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { sanitizeContent } from './src/utils/content.js';
        import app from './api/index.js';
        assert.equal(typeof app, 'function');
        assert.equal(sanitizeContent('<script>bad()</script><p>Safe</p>'), '<p>Safe</p>');
        const server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        try {
            const response = await fetch('http://127.0.0.1:' + server.address().port + '/healthz');
            assert.equal(response.status, 200);
            assert.deepEqual(await response.json(), { ok: true });
            const base = 'http://127.0.0.1:' + server.address().port;
            const session = await fetch(base + '/api/session');
            assert.match(session.headers.get('content-type'), /application\\/json/);
            await session.json();
            for (const route of ['/api/index.js', '/server.js', '/src/utils/session.js', '/generated/sanitize-html.cjs', '/sql/cms.sql', '/package.json', '/.env']) {
                const denied = await fetch(base + route);
                assert.equal(denied.status, 404, route);
            }
        } finally {
            await new Promise(resolve => server.close(resolve));
        }
    `], { cwd: new URL('.', import.meta.url), env: { ...process.env, VERCEL: '1' }, timeout: 15000, stdio: 'pipe' });
});

test('sanitizer preserves its URL, attribute, and class restrictions', () => {
    assert.equal(sanitizeContent('<img src="//example.test/a"><img src="data:image/png;base64,AA"><img src="mailto:a@example.test">'), '<img /><img /><img />');
    assert.equal(sanitizeContent('<a href="mailto:a@example.test" onclick="bad()">Mail</a>'), '<a href="mailto:a@example.test">Mail</a>');
    assert.equal(sanitizeContent('<u id="note" class="editor-heading unwanted">Text</u><img class="erp-editor-image unwanted" src="https://example.test/a" alt="A" width="20" height="10">'), '<u id="note" class="editor-heading">Text</u><img class="erp-editor-image" src="https://example.test/a" alt="A" width="20" height="10" />');
});

test('dynamic template starts read-only with complete editor controls', () => {
    const dom = new JSDOM(renderDocumentationPage({ page: { page: 'test', title: 'Test', scope: 'stage', content: '<img onerror="bad()">' } }));
    assert.equal(dom.window.document.querySelector('[contenteditable]').getAttribute('contenteditable'), 'false');
    for (const selector of ['[data-image-file]', '[data-image-url]', '[data-insert-image]', '[data-reset-editor]', '[data-editor-status]', '[data-insert-table]']) assert.ok(dom.window.document.querySelector(selector));
    assert.equal(dom.window.document.querySelector('[onerror]'), null);
});

test('admin defaults to STAGE, switches scope, collapses and preselects page parent', async () => {
    const dom = new JSDOM(await read('admin.html'), { runScripts: 'outside-only', url: 'https://example.test/admin.html' });
    const items = [
        { id: 'a', title: 'Order', scope: 'stage', parent_id: null, sort_order: 0 },
        { id: 'b', title: 'Cutting', scope: 'proman', parent_id: null, sort_order: 0 },
        { id: 'c', title: 'Detail', scope: 'stage', parent_id: 'a', page: 'detail', url: 'erp/detail.html', sort_order: 0 },
    ];
    dom.window.fetch = async () => ({ ok: true, json: async () => ({ items }) });
    dom.window.HTMLElement.prototype.scrollIntoView = function () {};
    dom.window.eval(await read('js/navigation-admin.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const document = dom.window.document;
    assert.match(document.querySelector('#navigationList').textContent, /Order/);
    assert.doesNotMatch(document.querySelector('#navigationList').textContent, /Cutting/);
    document.querySelector('[data-action="toggle"]').click();
    assert.equal(document.querySelector('.navigation-pages').hidden, true);
    document.querySelector('[data-action="add-page"]').click();
    assert.equal(document.querySelector('#navigationParentId').value, 'a');
    assert.equal(document.activeElement.id, 'navigationTitle');
    document.querySelector('[name="navigationScope"][value="proman"]').click();
    assert.match(document.querySelector('#navigationList').textContent, /Cutting/);
    assert.doesNotMatch(document.querySelector('#navigationList').textContent, /Order/);
    dom.window.close();
});

test('editor initializes without crashes and preserves tables for readers', async () => {
    const dom = new JSDOM(renderDocumentationPage({ page: { page: 'test', title: 'Test', scope: 'stage' } }), { runScripts: 'outside-only', url: 'https://example.test/docs/test' });
    dom.window.fetch = async (url) => ({ ok: true, json: async () => url === '/api/session' ? { isAdmin: false } : { content: '<h2>Heading</h2><table><tr><td>Cell</td></tr></table>' } });
    dom.window.eval(await read('js/erp-editor.js'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(dom.window.document.querySelector('[contenteditable]').contentEditable, 'false');
    assert.ok(dom.window.document.querySelector('table td'));
    assert.equal(dom.window.document.querySelector('.erp-loading-screen'), null);
    assert.equal(dom.window.document.querySelector('.erp-editor-toolbar').hidden, true);
    dom.window.close();
});

test('sidebar handles mixed roots and refreshes while retaining dashboard and FAQ', async () => {
    const dom = new JSDOM('<body data-page="admin"><div id="navbar"></div><aside id="sidebar"></aside></body>', { runScripts: 'outside-only', url: 'https://example.test/docs/test' });
    let items = [
        { id: 'wrapper', title: 'STAGE', scope: 'stage', parent_id: null },
        { id: 'module', title: 'Wrapped', scope: 'stage', parent_id: 'wrapper' },
        { id: 'root', title: 'Root module', scope: 'stage', parent_id: null },
        { id: 'page', title: 'Legacy page', scope: 'stage', parent_id: 'root', page: 'legacy', url: 'erp/legacy.html' },
    ];
    dom.window.fetch = async (url) => ({ ok: true, json: async () => url === '/api/session' ? {} : { items } });
    dom.window.eval(await read('js/navbar.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const sidebar = dom.window.document.querySelector('#sidebar');
    assert.match(sidebar.textContent, /Wrapped/);
    assert.match(sidebar.textContent, /Root module/);
    assert.match(sidebar.textContent, /FAQ/);
    assert.ok(sidebar.querySelector('.sidebar-dashboard'));
    assert.equal(sidebar.querySelector('a[href="/erp/legacy.html"]').pathname, '/erp/legacy.html');
    items = [];
    dom.window.document.dispatchEvent(new dom.window.Event('kb:navigation-changed'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.doesNotMatch(sidebar.textContent, /Root module/);
    assert.match(sidebar.textContent, /FAQ/);
    dom.window.close();
});

test('unauthenticated docs middleware rejects before handler', async () => {
    const { requireSession } = await import('./src/middlewares/auth.js');
    let code;
    let continued = false;
    const response = { status(value) { code = value; return this; }, json(value) { return value; } };
    await requireSession({ cookies: {} }, response, () => { continued = true; });
    assert.equal(code, 401);
    assert.equal(continued, false);
    assert.match(await read('server.js'), /app.get\("\/docs\/:page", requireSession, getDynamicPage\)/);
});

test('transactional migration preserves legacy data and atomically creates and orders pages', async () => {
    const db = new PGlite();
    try {
        await db.exec('create role anon; create role authenticated; create role service_role;');
        const schema = await read('sql/cms.sql');
        await db.exec(schema.slice(0, schema.indexOf('insert into storage.buckets')));
        await db.exec(await read('sql/navigation-management.sql'));
        const save = async (item) => (await db.query('select public.cms_navigation_save($1::jsonb) as item', [JSON.stringify(item)])).rows[0].item;
        const module = await save({ type: 'module', scope: 'stage', title: 'Order' });
        const wrapper = await save({ type: 'module', scope: 'stage', title: 'STAGE' });
        const wrapped = await save({ type: 'module', scope: 'stage', title: 'Wrapped', parent_id: wrapper.id });
        await db.query('select cms_navigation_move($1, -1)', [wrapped.id]);
        assert.equal((await db.query('select sort_order from cms_navigation where id=$1', [wrapped.id])).rows[0].sort_order, 0);
        const page = await save({ type: 'page', scope: 'stage', title: 'Detail', parent_id: module.id });
        assert.ok(page.page.endsWith(page.id));
        assert.equal((await db.query('select count(*)::int as count from cms_materials')).rows[0].count, 1);
        await db.query('update cms_navigation set url=$1 where id=$2', ['erp/legacy.html', page.id]);
        const edited = await save({ id: page.id, type: 'page', scope: 'stage', title: 'Renamed', parent_id: module.id });
        assert.equal(edited.url, 'erp/legacy.html');
        assert.equal(edited.page, page.page);
        const second = await save({ type: 'page', scope: 'stage', title: 'Detail', parent_id: module.id });
        assert.notEqual(second.page, page.page);
        await db.query('select cms_navigation_move($1, -1)', [second.id]);
        assert.equal((await db.query('select id from cms_navigation where parent_id=$1 order by sort_order', [module.id])).rows[0].id, second.id);
        await assert.rejects(save({ type: 'page', scope: 'proman', title: 'Wrong area', parent_id: module.id }));
        await assert.rejects(save({ id: module.id, type: 'module', scope: 'stage', title: 'Cycle', parent_id: module.id }));
        await assert.rejects(db.query('select cms_navigation_remove($1)', [module.id]));
        await db.exec("create function reject_content() returns trigger language plpgsql as $$ begin raise exception 'test failure'; end $$; create trigger reject_content before insert on cms_materials for each row execute function reject_content();");
        const before = (await db.query('select count(*)::int as count from cms_navigation')).rows[0].count;
        await assert.rejects(save({ type: 'page', scope: 'stage', title: 'Rollback', parent_id: module.id }));
        assert.equal((await db.query('select count(*)::int as count from cms_navigation')).rows[0].count, before);
        const privileges = await db.query("select has_function_privilege('anon', 'public.cms_navigation_save(jsonb,text)', 'execute') as allowed");
        assert.equal(privileges.rows[0].allowed, false);
    } finally {
        await db.close();
    }
});
