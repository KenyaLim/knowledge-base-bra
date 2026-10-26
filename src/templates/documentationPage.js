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
<body data-page="${pageKey}" data-cms-slug="${pageKey}">
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
                    <div class="erp-editor-toolbar" aria-label="Documentation editor" hidden></div>
                    <article class="doc-block"><div contenteditable="true" spellcheck="true">${content}</div></article>
                </div>
            </section>
        </main>
    </div>
    <script src="/js/navbar.js"></script>
    <script src="/js/erp-editor.js"></script>
</body>
</html>`;
}
