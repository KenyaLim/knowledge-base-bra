import { copyFile, lstat, mkdir, readdir, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'public');
const files = [
    'index.html', 'login.html', 'admin.html', 'materials.html', 'material.html', 'ERP Docs.html',
    'css/style.css', 'js/admin.js', 'js/cms.js', 'js/erp-editor.js',
    'js/navbar.js', 'js/navigation-admin.js', 'users.html', 'js/users.js',
    'faq-admin.html', 'js/faq.js', 'css/faq.css',
];

async function collectPages(directory) {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) await collectPages(relative);
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(relative);
    }
}

await rm(output, { recursive: true, force: true });
for (const directory of ['erp', 'proman', 'stage', 'getting-started']) {
    if (!(await lstat(path.join(root, directory))).isDirectory()) throw new Error(`Invalid public directory: ${directory}`);
    await collectPages(directory);
}
await build({
    absWorkingDir: root,
    entryPoints: ['node_modules/sanitize-html/index.js'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    legalComments: 'none',
    outfile: 'generated/sanitize-html.cjs',
});
const aliases = {};
for (const file of files) {
    if (file.endsWith('.html')) {
        let html = '';
        try { html = await readFile(path.join(root, file), 'utf8'); } catch (error) { if (error.code === 'ENOENT' && ['faq-admin.html'].includes(file)) continue; throw error; }
        const body = html.match(/<body\b[^>]*>/i)?.[0] || '';
        const page = body.match(/data-page="([^"]+)"/)?.[1];
        const slug = body.match(/data-cms-slug="([^"]+)"/)?.[1];
        if (page) aliases['/' + file.replace(/\.html$/, '')] = { page, slug: slug || `erp-${page}` };
    }
    try {
        if (!(await lstat(path.join(root, file))).isFile()) throw new Error(`Invalid public file: ${file}`);
    } catch (error) {
        if (error.code === 'ENOENT' && ['faq-admin.html', 'js/faq.js', 'css/faq.css'].includes(file)) continue;
        throw error;
    }
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(root, file), destination);
}
await writeFile(path.join(root, 'generated/navigation-aliases.json'), JSON.stringify(aliases));
