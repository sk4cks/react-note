const URL_PATTERN =
  /(?:https?:\/\/|cursor:\/\/|mailto:)[^\s<>"')\]]+/g;

function trimTrailingPunctuation(url) {
  return url.replace(/[),.;!?]+$/, "");
}

export function linkifyPlainText(text) {
  if (!text) {
    return [];
  }

  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const rawUrl = match[0];
    const url = trimTrailingPunctuation(rawUrl);
    const trailing = rawUrl.slice(url.length);

    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    parts.push({ type: "link", value: url });
    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }

    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}
