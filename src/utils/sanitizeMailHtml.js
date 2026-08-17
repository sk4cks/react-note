import DOMPurify from "dompurify";

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizeMailHtml(html) {
  return DOMPurify.sanitize(html ?? "", {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["style"],
    ADD_ATTR: [
      "target",
      "align",
      "bgcolor",
      "border",
      "cellpadding",
      "cellspacing",
      "class",
      "id",
      "width",
      "height",
      "valign",
      "colspan",
      "rowspan",
      "role",
      "style",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
