import { useMemo } from "react";
import { sanitizeMailHtml } from "@/utils/sanitizeMailHtml";

/** 위험한 태그를 걷어낸 HTML 본문. */
const MailHtmlBody = ({
  html, // 원본 HTML
  className, // 본문 클래스
}) => {
  const safeHtml = useMemo(() => sanitizeMailHtml(html), [html]); // 스크립트 등 제거

  return (
    <>

      {/* 정화된 HTML */}
      <div
        className = {className}
        dangerouslySetInnerHTML = {{ __html: safeHtml }}
      />
    </>
  );
};

export default MailHtmlBody;
