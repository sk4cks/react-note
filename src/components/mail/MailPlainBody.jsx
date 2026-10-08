import { linkifyPlainText } from "@/utils/linkifyPlainText";

/** URL을 링크로 바꾸는 텍스트 본문. */
const MailPlainBody = ({
  text, // 원문
  className, // 본문 클래스
}) => {
  const parts = linkifyPlainText(text);

  if (parts.length === 0) {
    return <div className = {className} />; // 빈 본문
  }

  return (
    <div className = {className}>

      {/* 글과 링크 */}
      {parts.map((part, index) =>
        part.type === "link" ? (
          <a
            key = {index}
            href = {part.value}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.value}
          </a>
        ) : (
          <span key = {index}>{part.value}</span>
        )
      )}
    </div>
  );
};

export default MailPlainBody;
