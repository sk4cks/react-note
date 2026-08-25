import { useMemo } from "react";
import { sanitizeMailHtml } from "@/utils/sanitizeMailHtml";

/** HTML 본문. 위험한 태그는 걷어낸다. */
const MailHtmlBody = ({ html, className }) => {
  const safeHtml = useMemo(() => sanitizeMailHtml(html), [html]); // 스크립트 등 제거

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default MailHtmlBody;
