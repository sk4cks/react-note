import { useMemo } from "react";
import { sanitizeMailHtml } from "@/utils/sanitizeMailHtml";

const MailHtmlBody = ({ html, className }) => {
  const safeHtml = useMemo(() => sanitizeMailHtml(html), [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default MailHtmlBody;
