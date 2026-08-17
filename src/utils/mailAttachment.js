export const MAIL_MAX_BYTES = 10 * 1024 * 1024;
export const MAIL_MAX_ATTACHMENTS = 20;

export function estimateBase64Bytes(base64) {
  const compact = (base64 ?? "").replace(/\s/g, "");
  if (!compact) {
    return 0;
  }
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;

  return Math.floor((compact.length * 3) / 4) - padding;
}

export function inlineImageBytes(html) {
  const re = /src=["']data:image\/[^;]+;base64,([^"']+)["']/gi;
  let total = 0;
  let match;
  while ((match = re.exec(html ?? "")) !== null) {
    total += estimateBase64Bytes(match[1]);
  }

  return total;
}

export function attachmentBytes(attachments) {
  return (attachments ?? []).reduce(
    (sum, item) => sum + (item.size ?? estimateBase64Bytes(item.contentBase64)),
    0
  );
}

export function mailPayloadBytes(html, attachments) {
  return inlineImageBytes(html) + attachmentBytes(attachments);
}

export function formatBytes(n) {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBase64(dataUrl) {
  const comma = dataUrl.indexOf(",");

  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
