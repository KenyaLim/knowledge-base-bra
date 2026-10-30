import { copyFile, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'public');
const files = [
    'index.html', 'login.html', 'admin.html', 'materials.html', 'ERP Docs.html',
    'css/style.css', 'js/admin.js', 'js/cms.js', 'js/erp-editor.js',
    'js/navbar.js', 'js/navigation-admin.js',
    'users.html', 'password-setup.html', 'js/users.js', 'js/password-setup.js', 'css/users.css',
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
for (const file of files) {
    if (!(await lstat(path.join(root, file))).isFile()) throw new Error(`Invalid public file: ${file}`);
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(root, file), destination);
}
