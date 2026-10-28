import { sanitizeContent } from "../utils/content.js";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[character]));
}

export function renderDocumentationPage({ page, material }) {
  const title = material?.title || page.title;
  const h1 = material?.title || page.h1 || page.title;
  const summary = material?.summary || page.summary || "";
  const content = material?.content || page.content || "<h2>Overview</h2><p>Belum ada konten.</p>";
  const pageKey = escapeHtml(page.page);
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body data-page="${pageKey}" data-cms-slug="${escapeHtml(material?.slug || page.page)}" data-module="${escapeHtml(material?.module || page.title)}">
    <div id="navbar"></div>
    <div class="app-layout">
        <aside id="sidebar"></aside>
        <main class="main-content">
            <section class="hero">
                <div class="hero-content">
                    <p class="eyebrow">${escapeHtml(page.scope)}</p>
                    <h1>${escapeHtml(h1)}</h1>
                    <p class="hero-description">${escapeHtml(summary)}</p>
                </div>
            </section>
            <section class="section">
                <div class="documentation erp-editor" data-erp-editor>
                    <div class="erp-editor-toolbar" aria-label="Documentation editor" hidden>
                        <button type="button" data-command="bold">Bold</button>
                        <button type="button" data-command="italic">Italic</button>
                        <button type="button" data-command="insertUnorderedList">Daftar</button>
                        <button type="button" data-command="insertOrderedList">Nomor</button>
                        <button type="button" data-insert-table>Tabel</button>
                        <label class="erp-editor-file">Gambar<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-file></label>
                        <input type="url" data-image-url aria-label="URL gambar" placeholder="URL gambar">
                        <button type="button" data-insert-image>Tambah gambar</button>
                        <button type="button" data-reset-editor>Reset</button>
                    </div>
                    <article class="doc-block"><div contenteditable="false" spellcheck="true">${sanitizeContent(content)}</div></article>
                    <p data-editor-status class="editor-status" role="status" aria-live="polite"></p>
                </div>
            </section>
        </main>
    </div>
    <script src="/js/navbar.js"></script>
    <script src="/js/erp-editor.js"></script>
</body>
</html>`;
}
