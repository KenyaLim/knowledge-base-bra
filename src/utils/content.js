import sanitizeHtml from "sanitize-html";

export function sanitizeContent(value) {
  return sanitizeHtml(String(value || ""), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "u"]),
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "class"],
      "*": ["class", "id"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedClasses: { "*": ["editor-heading", "erp-editor-image"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
  });
}

export function sanitizeMaterial(value) {
  if (Array.isArray(value)) return value.map(sanitizeMaterial);
  return value ? { ...value, content: sanitizeContent(value.content) } : value;
}
