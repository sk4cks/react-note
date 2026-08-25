const URL_PATTERN =
  /(?:https?:\/\/|cursor:\/\/|mailto:)[^\s<>"')\]]+/g;

/** 링크 끝에 붙은 ),. 등을 뺀다. */
const trimTrailingPunctuation = (url) => {
  return url.replace(/[),.;!?]+$/, "");
};

/** 본문 글에서 URL을 링크 조각으로 나눈다. */
export const linkifyPlainText = (text) => {
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
};
