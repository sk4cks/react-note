export const MAIL_MAX_BYTES = 10 * 1024 * 1024;
export const MAIL_MAX_ATTACHMENTS = 20;

/** base64 길이를 대략 바이트로 환산한다. */
export const estimateBase64Bytes = (base64) => {
  const compact = (base64 ?? "").replace(/\s/g, "");
  if (!compact) {
    return 0;
  }
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;

  return Math.floor((compact.length * 3) / 4) - padding;
};

/** 본문 data URL 이미지 용량을 더한다. */
export const inlineImageBytes = (html) => {
  const re = /src=["']data:image\/[^;]+;base64,([^"']+)["']/gi;
  let total = 0;
  let match;
  while ((match = re.exec(html ?? "")) !== null) {
    total += estimateBase64Bytes(match[1]);
  }

  return total;
};

/** 첨부 파일 용량을 더한다. */
export const attachmentBytes = (attachments) => {
  return (attachments ?? []).reduce(
    (sum, item) => sum + (item.size ?? estimateBase64Bytes(item.contentBase64)),
    0
  );
};

/** 본문 이미지 + 첨부 총용량. */
export const mailPayloadBytes = (html, attachments) => {
  return inlineImageBytes(html) + attachmentBytes(attachments);
};

/** 바이트를 KB/MB 문자열로. */
export const formatBytes = (n) => {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

/** 쉼표·세미콜론으로 구분된 주소를 배열로 만든다. */
export const parseMailAddresses = (value) => {
  return (value ?? "")
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

/** `이름 <email>` 형태에서 이메일만 꺼낸다. */
export const parseMailAddressList = (value) => {
  return parseMailAddresses(value).map((part) => {
    const angled = part.match(/<([^>]+)>/);

    return (angled ? angled[1] : part).trim();
  }).filter(Boolean);
};

/** Blob을 첨부 payload(base64)로 읽는다. */
export const readBlobAsAttachment = (blob, filename, contentType) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const contentBase64 = dataUrlToBase64(String(reader.result ?? ""));
      resolve({
        id: `${filename}-${blob.size}-${Date.now()}`,
        filename,
        contentType: contentType || blob.type || "application/octet-stream",
        size: blob.size,
        contentBase64,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

/** 파일을 data URL로 읽는다. */
export const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/** data URL에서 base64 부분만 떼낸다. */
export const dataUrlToBase64 = (dataUrl) => {
  const comma = dataUrl.indexOf(",");

  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
};
