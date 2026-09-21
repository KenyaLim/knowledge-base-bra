document.addEventListener("DOMContentLoaded", async function () {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const title = document.getElementById("documentTitle");
    const module = document.getElementById("documentModule");
    const summary = document.getElementById("documentSummary");
    const content = document.getElementById("documentContent");

    if (!slug) {
        content.textContent = "Document slug is missing.";
        return;
    }

    try {
        const response = await fetch(`/api/documents?slug=${encodeURIComponent(slug)}`);
        const documents = await response.json();
        if (!response.ok || !documents[0]) throw new Error("Document not found");

        const document = documents[0];
        title.textContent = document.title;
        module.textContent = document.module;
        summary.textContent = document.summary || "";
        content.innerHTML = DOMPurify.sanitize(marked.parse(document.content));
        window.document.title = `DocuBase | ${document.title}`;
    } catch (error) {
        title.textContent = "Document unavailable";
        content.textContent = error.message;
    }
});